import { SALON_TIMEZONE } from "@/lib/payments/date-utils";
import type { AttendanceStatus } from "@/lib/attendance/types";

/** Current instant as ISO string (server clock). */
export function serverNowIso(): string {
  return new Date().toISOString();
}

function istMinutesSinceMidnight(at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SALON_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(at);

  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

function parseTimeToMinutes(time: string): number {
  const [hourPart, minutePart] = time.split(":");
  const hour = Number(hourPart);
  const minute = Number(minutePart ?? 0);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return 10 * 60;
  }
  return hour * 60 + minute;
}

/** Present if check-in is on or before lateAfter (HH:MM or HH:MM:SS), else late. */
export function deriveCheckInStatus(
  checkInTime: Date,
  lateAfter: string
): AttendanceStatus {
  const checkInMinutes = istMinutesSinceMidnight(checkInTime);
  const lateAfterMinutes = parseTimeToMinutes(lateAfter);
  return checkInMinutes > lateAfterMinutes ? "late" : "present";
}
