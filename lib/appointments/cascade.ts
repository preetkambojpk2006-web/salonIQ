import type { Appointment } from "@/lib/appointments/types";
import { calendarDayInTimezone, SALON_TIMEZONE } from "@/lib/payments/date-utils";

const ONE_HOUR_MS = 60 * 60 * 1000;
const TWO_HOURS_MS = 2 * ONE_HOUR_MS;
const ACTIVE_STATUSES = new Set(["pending", "confirmed"]);

export type CascadeAnchor = {
  id: string;
  customer_name: string | null;
  staff_name: string | null;
  service_name: string | null;
  old_start: string;
  old_end: string;
  new_start: string;
  new_end: string;
  delta_minutes: number;
};

export type CascadeShifted = {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  service_name: string | null;
  staff_name: string | null;
  old_start: string;
  old_end: string;
  new_start: string;
  new_end: string;
};

export type CascadePreview = {
  anchor: CascadeAnchor;
  shifted: CascadeShifted[];
  warnings: string[];
  has_hard_error: boolean;
};

export function effectiveEndTime(start: Date, end: Date | null): Date {
  if (end && !Number.isNaN(end.getTime())) {
    return end;
  }
  return new Date(start.getTime() + ONE_HOUR_MS);
}

export function normalizeStaffName(name: string | null | undefined): string {
  const trimmed = name?.trim();
  return trimmed ? trimmed.toLowerCase() : "";
}

function parseInstant(value: string): Date | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function toIso(date: Date): string {
  return date.toISOString();
}

function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean {
  return aStart.getTime() < bEnd.getTime() && bStart.getTime() < aEnd.getTime();
}

function closingTimeIst(istDay: string): Date {
  return new Date(`${istDay}T20:00:00+05:30`);
}

function openingTimeIst(istDay: string): Date {
  return new Date(`${istDay}T10:00:00+05:30`);
}

function isAfterClosing(end: Date, istDay: string): boolean {
  return end.getTime() > closingTimeIst(istDay).getTime();
}

function isBeforeOpening(start: Date, istDay: string): boolean {
  return start.getTime() < openingTimeIst(istDay).getTime();
}

function isActiveAppointment(appointment: Appointment): boolean {
  return ACTIVE_STATUSES.has(appointment.status);
}

function matchesAnchorStaff(
  appointment: Appointment,
  anchorStaff: string
): boolean {
  return normalizeStaffName(appointment.staff_name) === anchorStaff;
}

function buildShiftedRow(
  appointment: Appointment,
  deltaMs: number
): CascadeShifted {
  const oldStart = parseInstant(appointment.start_time)!;
  const oldEnd = effectiveEndTime(
    oldStart,
    appointment.end_time ? parseInstant(appointment.end_time) : null
  );
  const newStart = new Date(oldStart.getTime() + deltaMs);
  const newEnd = new Date(oldEnd.getTime() + deltaMs);

  return {
    id: appointment.id,
    customer_name: appointment.customer_name,
    customer_phone: appointment.customer_phone,
    service_name: appointment.service_name,
    staff_name: appointment.staff_name,
    old_start: toIso(oldStart),
    old_end: toIso(oldEnd),
    new_start: toIso(newStart),
    new_end: toIso(newEnd),
  };
}

function collectForwardShifted(
  anchor: Appointment,
  allDayAppointments: Appointment[],
  anchorStaff: string,
  oldEnd: Date,
  forwardDeltaMs: number
): CascadeShifted[] {
  if (forwardDeltaMs === 0) return [];

  return allDayAppointments
    .filter((appointment) => {
      if (appointment.id === anchor.id) return false;
      if (!isActiveAppointment(appointment)) return false;
      if (!matchesAnchorStaff(appointment, anchorStaff)) return false;

      const start = parseInstant(appointment.start_time);
      if (!start) return false;

      return start.getTime() >= oldEnd.getTime();
    })
    .sort((a, b) => a.start_time.localeCompare(b.start_time))
    .map((appointment) => buildShiftedRow(appointment, forwardDeltaMs));
}

function collectBackwardShifted(
  anchor: Appointment,
  allDayAppointments: Appointment[],
  anchorStaff: string,
  oldStart: Date,
  backwardDeltaMs: number
): CascadeShifted[] {
  if (backwardDeltaMs === 0) return [];

  return allDayAppointments
    .filter((appointment) => {
      if (appointment.id === anchor.id) return false;
      if (!isActiveAppointment(appointment)) return false;
      if (!matchesAnchorStaff(appointment, anchorStaff)) return false;

      const start = parseInstant(appointment.start_time);
      if (!start) return false;

      return start.getTime() < oldStart.getTime();
    })
    .sort((a, b) => b.start_time.localeCompare(a.start_time))
    .map((appointment) => buildShiftedRow(appointment, backwardDeltaMs));
}

export function computeCascadePreview(
  anchor: Appointment,
  allDayAppointments: Appointment[],
  newStart: Date,
  newEnd: Date
): CascadePreview {
  const warnings: string[] = [];
  let has_hard_error = false;

  const oldStart = parseInstant(anchor.start_time)!;
  const oldEnd = effectiveEndTime(
    oldStart,
    anchor.end_time ? parseInstant(anchor.end_time) : null
  );
  const forwardDeltaMs = newEnd.getTime() - oldEnd.getTime();
  const backwardDeltaMs = newStart.getTime() - oldStart.getTime();
  const shouldBackwardCascade =
    newEnd.getTime() < oldEnd.getTime() ||
    newStart.getTime() < oldStart.getTime();
  const delta_minutes = Math.round(forwardDeltaMs / (60 * 1000));
  const istDay = calendarDayInTimezone(oldStart, SALON_TIMEZONE);
  const anchorStaff = normalizeStaffName(anchor.staff_name);

  const cascadeAnchor: CascadeAnchor = {
    id: anchor.id,
    customer_name: anchor.customer_name,
    staff_name: anchor.staff_name,
    service_name: anchor.service_name,
    old_start: toIso(oldStart),
    old_end: toIso(oldEnd),
    new_start: toIso(newStart),
    new_end: toIso(newEnd),
    delta_minutes,
  };

  const forwardShifted = collectForwardShifted(
    anchor,
    allDayAppointments,
    anchorStaff,
    oldEnd,
    forwardDeltaMs
  );

  const backwardShifted = shouldBackwardCascade
    ? collectBackwardShifted(
        anchor,
        allDayAppointments,
        anchorStaff,
        oldStart,
        backwardDeltaMs
      )
    : [];

  const shiftedById = new Map<string, CascadeShifted>();
  for (const row of [...backwardShifted, ...forwardShifted]) {
    shiftedById.set(row.id, row);
  }
  const shifted = Array.from(shiftedById.values()).sort((a, b) =>
    a.old_start.localeCompare(b.old_start)
  );

  if (shouldBackwardCascade) {
    if (isBeforeOpening(newStart, istDay)) {
      has_hard_error = true;
      warnings.push(
        "Appointment 10 AM se pehle shift nahi ho sakti."
      );
    }

    for (const row of backwardShifted) {
      const shiftedStart = parseInstant(row.new_start)!;
      if (isBeforeOpening(shiftedStart, istDay)) {
        has_hard_error = true;
        warnings.push(
          `${row.customer_name ?? "Pehle wali appointment"} 10 AM se pehle chali jayegi — shift block ho gaya.`
        );
      }
    }
  }

  const shiftedIds = new Set(shifted.map((row) => row.id));

  const nonShifted = allDayAppointments.filter((appointment) => {
    if (appointment.id === anchor.id) return false;
    if (shiftedIds.has(appointment.id)) return false;
    if (!isActiveAppointment(appointment)) return false;
    if (!matchesAnchorStaff(appointment, anchorStaff)) return false;
    return true;
  });

  const finalSlots: Array<{ id: string; start: Date; end: Date }> = [
    { id: anchor.id, start: newStart, end: newEnd },
    ...shifted.map((row) => ({
      id: row.id,
      start: parseInstant(row.new_start)!,
      end: parseInstant(row.new_end)!,
    })),
  ];

  const unchangedSlots = nonShifted.map((appointment) => {
    const start = parseInstant(appointment.start_time)!;
    const end = effectiveEndTime(
      start,
      appointment.end_time ? parseInstant(appointment.end_time) : null
    );
    return { id: appointment.id, start, end };
  });

  for (const moved of finalSlots) {
    for (const other of unchangedSlots) {
      if (rangesOverlap(moved.start, moved.end, other.start, other.end)) {
        has_hard_error = true;
        warnings.push(
          "Shift ke baad staff ke do appointments overlap ho rahe hain — time adjust karein."
        );
        break;
      }
    }
    if (has_hard_error) break;
  }

  for (let i = 0; i < finalSlots.length; i++) {
    for (let j = i + 1; j < finalSlots.length; j++) {
      const moved = finalSlots[i];
      const other = finalSlots[j];
      if (rangesOverlap(moved.start, moved.end, other.start, other.end)) {
        has_hard_error = true;
        warnings.push(
          "Cascade shift ke baad appointments overlap ho rahe hain."
        );
        break;
      }
    }
    if (has_hard_error) break;
  }

  const slotsToCheckClosing = [
    { label: "anchor", end: newEnd },
    ...shifted.map((row) => ({
      label: row.customer_name ?? "Customer",
      end: parseInstant(row.new_end)!,
    })),
  ];

  for (const slot of slotsToCheckClosing) {
    if (isAfterClosing(slot.end, istDay)) {
      warnings.push(
        `${slot.label === "anchor" ? "Yeh appointment" : slot.label} 8 PM ke baad khatam ho rahi hai.`
      );
    }
  }

  const largestShiftMs = Math.max(
    Math.abs(forwardDeltaMs),
    shouldBackwardCascade ? Math.abs(backwardDeltaMs) : 0
  );

  if (largestShiftMs > TWO_HOURS_MS) {
    warnings.push(
      `Shift ${Math.round(largestShiftMs / (60 * 1000))} minute ka hai — 2 ghante se zyada. Customers ko inform karein.`
    );
  }

  if (!anchor.customer_phone?.trim()) {
    warnings.push(
      `${anchor.customer_name ?? "Anchor customer"} ka phone number nahi hai — WhatsApp manually nahi bhej sakte.`
    );
  }

  for (const row of shifted) {
    if (!row.customer_phone?.trim()) {
      warnings.push(
        `${row.customer_name ?? "Customer"} ka phone number nahi hai — WhatsApp manually nahi bhej sakte.`
      );
    }
  }

  return {
    anchor: cascadeAnchor,
    shifted,
    warnings: Array.from(new Set(warnings)),
    has_hard_error,
  };
}
