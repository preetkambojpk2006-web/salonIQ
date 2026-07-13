/** Salon operating timezone — used for "today" revenue boundaries */
export const SALON_TIMEZONE = "Asia/Kolkata";

/** YYYY-MM-DD in the given timezone */
export function calendarDayInTimezone(
  value: string | Date,
  timeZone = SALON_TIMEZONE
): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("en-CA", { timeZone });
}

export function todayCalendarDay(timeZone = SALON_TIMEZONE): string {
  return calendarDayInTimezone(new Date(), timeZone);
}

function dayOfWeekInTimezone(date: Date, timeZone: string): number {
  const short = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(date);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[short] ?? 0;
}

/** Monday of the current week (YYYY-MM-DD) in salon timezone */
export function mondayOfWeekCalendarDay(
  timeZone = SALON_TIMEZONE,
  reference = new Date()
): string {
  const today = calendarDayInTimezone(reference, timeZone);
  const dow = dayOfWeekInTimezone(reference, timeZone);
  const daysFromMonday = dow === 0 ? 6 : dow - 1;
  return addCalendarDays(today, -daysFromMonday, timeZone);
}

export function isCalendarDayOnOrAfter(
  day: string,
  startDay: string
): boolean {
  return day >= startDay;
}

/** Add calendar days without using local-time setDate (safe on any server TZ). */
export function addCalendarDays(
  day: string,
  days: number,
  timeZone = SALON_TIMEZONE
): string {
  const [year, month, dayNum] = day.split("-").map(Number);
  const noonIstUtc = Date.UTC(year, month - 1, dayNum + days, 6, 30, 0);
  return calendarDayInTimezone(new Date(noonIstUtc), timeZone);
}

/** Inclusive start and exclusive end for filtering paid_at in Supabase (IST day) */
export function getDayBoundsIso(
  day: string = todayCalendarDay(),
  timeZone = SALON_TIMEZONE
): { startIso: string; endIsoExclusive: string; day: string } {
  const startIso = new Date(`${day}T00:00:00+05:30`).toISOString();
  const endIsoExclusive = new Date(
    `${addCalendarDays(day, 1, timeZone)}T00:00:00+05:30`
  ).toISOString();
  return { startIso, endIsoExclusive, day };
}

/** Money page date-range presets. */
export const MONEY_RANGES = [
  "today",
  "week",
  "month",
  "3months",
  "6months",
] as const;

export type MoneyRange = (typeof MONEY_RANGES)[number];

/** Coerce an arbitrary search-param value into a valid range (default: week). */
export function normalizeMoneyRange(value?: string | null): MoneyRange {
  return (MONEY_RANGES as readonly string[]).includes(value ?? "")
    ? (value as MoneyRange)
    : "week";
}

/** Calendar day (YYYY-MM-DD) `months` before `day`, in salon timezone. */
function monthsAgoCalendarDay(
  day: string,
  months: number,
  timeZone = SALON_TIMEZONE
): string {
  const [year, month, dayNum] = day.split("-").map(Number);
  // Anchor at noon IST (06:30 UTC) so DST-free IST never rolls the date.
  const utc = Date.UTC(year, month - 1 - months, dayNum, 6, 30, 0);
  return calendarDayInTimezone(new Date(utc), timeZone);
}

function moneyRangeStartDay(range: MoneyRange, today: string): string {
  switch (range) {
    case "today":
      return today;
    case "week":
      return mondayOfWeekCalendarDay();
    case "month": {
      const [year, month] = today.split("-").map(Number);
      return `${year}-${String(month).padStart(2, "0")}-01`;
    }
    case "3months":
      return monthsAgoCalendarDay(today, 3);
    case "6months":
      return monthsAgoCalendarDay(today, 6);
    default:
      return mondayOfWeekCalendarDay();
  }
}

/**
 * Inclusive-start / exclusive-end ISO bounds for a money range.
 * End is always the exclusive end of today (tomorrow 00:00 IST) so the
 * current day's payments are always included.
 */
export function getMoneyRangeBounds(range: MoneyRange): {
  startIso: string;
  endIsoExclusive: string;
  startDay: string;
} {
  const today = todayCalendarDay();
  const { endIsoExclusive } = getDayBoundsIso(today);
  const startDay = moneyRangeStartDay(range, today);
  const { startIso } = getDayBoundsIso(startDay);
  return { startIso, endIsoExclusive, startDay };
}
