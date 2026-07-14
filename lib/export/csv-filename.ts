import { todayCalendarDay } from "@/lib/payments/date-utils";

export function csvFilename(prefix: string): string {
  return `saloniq-${prefix}-${todayCalendarDay()}.csv`;
}
