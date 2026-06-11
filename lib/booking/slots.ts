import { SALON_TIMEZONE } from "@/lib/payments/date-utils";

export const BOOKING_OPEN_HOUR = 10;
export const BOOKING_CLOSE_HOUR = 20;
export const BOOKING_SLOT_MINUTES = 30;
export const BOOKING_ASSUMED_BUSY_MINUTES = 60;

export type TimeSlotOption = {
  label: string;
  iso: string;
};

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function istSlotIso(date: string, hour: number, minute: number): string {
  return `${date}T${pad2(hour)}:${pad2(minute)}:00+05:30`;
}

export function generateDaySlots(date: string): TimeSlotOption[] {
  const slots: TimeSlotOption[] = [];

  for (let hour = BOOKING_OPEN_HOUR; hour < BOOKING_CLOSE_HOUR; hour++) {
    for (const minute of [0, 30]) {
      if (hour === BOOKING_CLOSE_HOUR - 1 && minute === 30) {
        continue;
      }
      const iso = istSlotIso(date, hour, minute);
      const label = new Date(iso).toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: SALON_TIMEZONE,
      });
      slots.push({ label, iso });
    }
  }

  return slots;
}

function rangesOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return startA < endB && endA > startB;
}

export function isSlotAvailable(params: {
  slotIso: string;
  durationMins: number;
  busyStarts: string[];
  now?: Date;
}): boolean {
  const now = params.now ?? new Date();
  const slotStart = new Date(params.slotIso).getTime();
  const slotEnd = slotStart + params.durationMins * 60_000;

  if (slotStart <= now.getTime()) {
    return false;
  }

  const closeMs =
    new Date(istSlotIso(params.slotIso.slice(0, 10), BOOKING_CLOSE_HOUR, 0)).getTime();
  if (slotEnd > closeMs) {
    return false;
  }

  for (const busy of params.busyStarts) {
    const busyStart = new Date(busy).getTime();
    const busyEnd = busyStart + BOOKING_ASSUMED_BUSY_MINUTES * 60_000;
    if (rangesOverlap(slotStart, slotEnd, busyStart, busyEnd)) {
      return false;
    }
  }

  return true;
}

export function maxBookingDateIso(daysAhead = 30): string {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toLocaleDateString("en-CA", { timeZone: SALON_TIMEZONE });
}

export function todayDateIso(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: SALON_TIMEZONE });
}
