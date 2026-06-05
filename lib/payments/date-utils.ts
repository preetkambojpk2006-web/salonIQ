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
