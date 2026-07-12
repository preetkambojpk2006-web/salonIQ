import {
  DEFAULT_BOOKING_CLOSE_HOUR,
  DEFAULT_BOOKING_OPEN_HOUR,
  type BookingHours,
} from "@/lib/booking/opening-hours";
import { SALON_TIMEZONE } from "@/lib/payments/date-utils";

export const BOOKING_OPEN_HOUR = DEFAULT_BOOKING_OPEN_HOUR;
export const BOOKING_CLOSE_HOUR = DEFAULT_BOOKING_CLOSE_HOUR;
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

/** Hourly rows for the internal calendar grid (open through close, inclusive). */
export function buildCalendarHourRows(
  hours: BookingHours = {
    openHour: BOOKING_OPEN_HOUR,
    closeHour: BOOKING_CLOSE_HOUR,
  }
): { hour: number; label: string }[] {
  const rows: { hour: number; label: string }[] = [];

  for (let hour = hours.openHour; hour <= hours.closeHour; hour++) {
    const iso = istSlotIso("2000-01-01", hour, 0);
    const label = new Date(iso).toLocaleTimeString("en-US", {
      hour: "numeric",
      hour12: true,
      timeZone: SALON_TIMEZONE,
    });
    rows.push({ hour, label });
  }

  return rows;
}

/** Extract HH:MM from an IST slot ISO for form submission. */
export function slotIsoToFormTime(iso: string): string {
  return iso.slice(11, 16);
}

export function generateDaySlots(
  date: string,
  hours: BookingHours = {
    openHour: BOOKING_OPEN_HOUR,
    closeHour: BOOKING_CLOSE_HOUR,
  }
): TimeSlotOption[] {
  const slots: TimeSlotOption[] = [];
  const openMinutes = hours.openHour * 60;
  const closeMinutes = hours.closeHour * 60;

  for (
    let totalMinutes = openMinutes;
    totalMinutes < closeMinutes;
    totalMinutes += BOOKING_SLOT_MINUTES
  ) {
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    const iso = istSlotIso(date, hour, minute);
    const label = new Date(iso).toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: SALON_TIMEZONE,
    });
    slots.push({ label, iso });
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
  closeHour?: number;
  now?: Date;
}): boolean {
  const now = params.now ?? new Date();
  const slotStart = new Date(params.slotIso).getTime();
  const slotEnd = slotStart + params.durationMins * 60_000;
  const closeHour = params.closeHour ?? BOOKING_CLOSE_HOUR;

  if (slotStart <= now.getTime()) {
    return false;
  }

  const closeMs = new Date(
    istSlotIso(params.slotIso.slice(0, 10), closeHour, 0)
  ).getTime();
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
