import type { HappyHourMatch, HappyHourRule } from "@/lib/pricing/types";
import { SALON_TIMEZONE } from "@/lib/payments/date-utils";
import { createClient } from "@/lib/supabase/server";

const DAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function parseTimeToMinutes(value: string): number {
  const parts = value.trim().split(":");
  const hour = Number(parts[0] ?? 0);
  const minute = Number(parts[1] ?? 0);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return 0;
  }
  return hour * 60 + minute;
}

export function getIstDayAndTime(bookingDateTime: string | Date): {
  dayOfWeek: number;
  minutes: number;
} {
  const date =
    typeof bookingDateTime === "string"
      ? new Date(bookingDateTime)
      : bookingDateTime;

  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: SALON_TIMEZONE,
    weekday: "short",
  }).format(date);

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: SALON_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(
    parts.find((part) => part.type === "minute")?.value ?? 0
  );

  return {
    dayOfWeek: DAY_MAP[weekday] ?? 0,
    minutes: hour * 60 + minute,
  };
}

export function matchHappyHourRule(
  rules: HappyHourRule[],
  bookingDateTime: string | Date
): HappyHourMatch | null {
  if (!rules.length) {
    return null;
  }

  const { dayOfWeek, minutes } = getIstDayAndTime(bookingDateTime);

  for (const rule of rules) {
    if (rule.is_active === false) {
      continue;
    }
    if (rule.day_of_week !== dayOfWeek) {
      continue;
    }

    const startMinutes = parseTimeToMinutes(rule.start_time);
    const endMinutes = parseTimeToMinutes(rule.end_time);

    if (minutes >= startMinutes && minutes < endMinutes) {
      const discountPercent = Number(rule.discount_percent);
      if (!Number.isFinite(discountPercent) || discountPercent <= 0) {
        continue;
      }
      return {
        discountPercent,
        ruleName: rule.name,
      };
    }
  }

  return null;
}

export function applyHappyHourDiscount(
  price: number,
  discountPercent: number
): number {
  const discounted = price * (1 - discountPercent / 100);
  return Math.max(0, Math.round(discounted));
}

type HappyHourSupabaseClient = Pick<
  ReturnType<typeof createClient>,
  "from"
>;

export async function resolveHappyHourDiscount(
  businessId: string,
  bookingDateTime: string | Date,
  supabase: HappyHourSupabaseClient
): Promise<HappyHourMatch | null> {
  const { data, error } = await supabase
    .from("happy_hours")
    .select("name, day_of_week, start_time, end_time, discount_percent, is_active")
    .eq("business_id", businessId)
    .eq("is_active", true);

  if (error || !data?.length) {
    return null;
  }

  const rules: HappyHourRule[] = data.map((row) => ({
    name: row.name as string,
    day_of_week: Number(row.day_of_week),
    start_time: String(row.start_time).slice(0, 8),
    end_time: String(row.end_time).slice(0, 8),
    discount_percent: Number(row.discount_percent),
    is_active: row.is_active as boolean,
  }));

  return matchHappyHourRule(rules, bookingDateTime);
}

export function formatHappyHourTimeRange(
  startTime: string,
  endTime: string
): string {
  const formatLabel = (value: string) => {
    const minutes = parseTimeToMinutes(value);
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const iso = `2000-01-01T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+05:30`;
    return new Date(iso).toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: SALON_TIMEZONE,
    });
  };

  return `${formatLabel(startTime)} – ${formatLabel(endTime)}`;
}

export const DAY_OF_WEEK_KEYS = [
  "settings.happyHoursDaySun",
  "settings.happyHoursDayMon",
  "settings.happyHoursDayTue",
  "settings.happyHoursDayWed",
  "settings.happyHoursDayThu",
  "settings.happyHoursDayFri",
  "settings.happyHoursDaySat",
] as const;
