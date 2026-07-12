import { parseOpeningHours } from "@/lib/onboarding/skips";

export const DEFAULT_BOOKING_OPEN_HOUR = 9;
export const DEFAULT_BOOKING_CLOSE_HOUR = 20;
/** Internal calendar / owner booking fallback when no hours configured. */
export const INTERNAL_DEFAULT_CLOSE_HOUR = 21;

export type BookingHours = {
  openHour: number;
  closeHour: number;
};

function normalizeHours(openHour: number, closeHour: number): BookingHours {
  if (
    !Number.isFinite(openHour) ||
    !Number.isFinite(closeHour) ||
    openHour < 0 ||
    openHour > 23 ||
    closeHour <= openHour ||
    closeHour > 24
  ) {
    return {
      openHour: DEFAULT_BOOKING_OPEN_HOUR,
      closeHour: DEFAULT_BOOKING_CLOSE_HOUR,
    };
  }

  return { openHour: Math.floor(openHour), closeHour: Math.floor(closeHour) };
}

function to24Hour(hour: number, meridiem?: string): number {
  if (!meridiem) {
    return hour;
  }

  const m = meridiem.toLowerCase().replace(/\./g, "").trim();
  if (m.startsWith("p")) {
    return hour === 12 ? 12 : hour + 12;
  }
  if (m.startsWith("a")) {
    return hour === 12 ? 0 : hour;
  }

  return hour;
}

/** Parse common display strings like "Mon–Sat, 10am – 9pm" or "9 AM - 9 PM". */
export function parseHoursFromDisplay(display: string): BookingHours | null {
  const normalized = display.replace(/[\u2013\u2014]/g, "-").trim();
  const match = normalized.match(
    /(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?\s*-\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)/i
  );

  if (!match) {
    return null;
  }

  const openRaw = Number.parseInt(match[1], 10);
  const closeRaw = Number.parseInt(match[4], 10);
  const openMer = match[3];
  const closeMer = match[6];

  const openHour = to24Hour(openRaw, openMer ?? "am");
  let closeHour = to24Hour(closeRaw, closeMer ?? "pm");

  if (!closeMer && closeHour <= openHour) {
    closeHour = to24Hour(closeRaw, "pm");
  }

  return normalizeHours(openHour, closeHour);
}

export function parseOpeningHoursForBooking(
  raw: unknown,
  fallbackCloseHour = DEFAULT_BOOKING_CLOSE_HOUR
): BookingHours {
  const record = parseOpeningHours(raw);

  const structuredOpen = Number(record.open_hour);
  const structuredClose = Number(record.close_hour);
  if (
    Number.isFinite(structuredOpen) &&
    Number.isFinite(structuredClose) &&
    structuredOpen >= 0 &&
    structuredClose > structuredOpen
  ) {
    return normalizeHours(structuredOpen, structuredClose);
  }

  const display =
    typeof record.display === "string" ? record.display.trim() : "";
  if (display) {
    const parsed = parseHoursFromDisplay(display);
    if (parsed) {
      return parsed;
    }
  }

  return {
    openHour: DEFAULT_BOOKING_OPEN_HOUR,
    closeHour: fallbackCloseHour,
  };
}

/** Owner-facing calendar/booking — 9am–9pm when salon hours are not set. */
export function parseInternalBookingHours(raw: unknown): BookingHours {
  return parseOpeningHoursForBooking(raw, INTERNAL_DEFAULT_CLOSE_HOUR);
}

/** Persist display text plus parsed open/close hours on businesses.opening_hours. */
export function enrichOpeningHours(
  display: string | null | undefined,
  existing?: unknown
): Record<string, unknown> {
  const base = parseOpeningHours(existing);
  const trimmed = display?.trim();

  if (!trimmed) {
    return { ...base };
  }

  const parsed = parseHoursFromDisplay(trimmed);

  return {
    ...base,
    display: trimmed,
    ...(parsed
      ? { open_hour: parsed.openHour, close_hour: parsed.closeHour }
      : {}),
  };
}

export function formatBookingHoursLabel(hours: BookingHours): string {
  const formatHour = (hour: number) => {
    const period = hour >= 12 ? "pm" : "am";
    const hour12 = hour % 12 || 12;
    return `${hour12}${period}`;
  };

  return `Slots ${formatHour(hours.openHour)}–${formatHour(hours.closeHour)} (IST)`;
}
