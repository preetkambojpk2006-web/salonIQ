import { SALON_TIMEZONE } from "@/lib/payments/date-utils";

/**
 * 12-hour clock with uppercase AM/PM.
 * Avoids toLocaleTimeString so server (Node) and client (browser) match exactly.
 */
export function formatTime12h(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const hours24 = date.getHours();
  const minutes = date.getMinutes();
  const period = hours24 < 12 ? "AM" : "PM";
  const hours12 = hours24 % 12 || 12;

  return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
}

/** 12-hour clock in salon timezone (Asia/Kolkata). */
export function formatTime12hInSalon(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SALON_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(date);

  const hour = parts.find((p) => p.type === "hour")?.value ?? "12";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  const period = parts.find((p) => p.type === "dayPeriod")?.value?.toUpperCase() ?? "AM";

  return `${hour}:${minute} ${period}`;
}
