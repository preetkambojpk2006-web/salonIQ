import { buildDemandHeatmap } from "@/lib/insights/queries";
import type { HeatmapRow } from "@/lib/insights/types";
import {
  addCalendarDays,
  calendarDayInTimezone,
  getDayBoundsIso,
  SALON_TIMEZONE,
  todayCalendarDay,
} from "@/lib/payments/date-utils";
import { createClient } from "@/lib/supabase/server";

export type RevenueTrendPoint = {
  day: string;
  label: string;
  amount: number;
};

export type TopServicePoint = {
  name: string;
  count: number;
};

export type DashboardAnalyticsData = {
  revenueTrend: RevenueTrendPoint[];
  topServices: TopServicePoint[];
  heatmapRows: HeatmapRow[];
  showHeatmap: boolean;
};

const EMPTY_ANALYTICS: DashboardAnalyticsData = {
  revenueTrend: [],
  topServices: [],
  heatmapRows: [],
  showHeatmap: false,
};

function shortWeekdayLabel(day: string): string {
  const date = new Date(`${day}T12:00:00+05:30`);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: SALON_TIMEZONE,
    weekday: "short",
  }).format(date);
}

function lastSevenCalendarDays(): string[] {
  const today = todayCalendarDay();
  return Array.from({ length: 7 }, (_, index) =>
    addCalendarDays(today, index - 6)
  );
}

export async function getRevenueTrend7Days(
  businessId: string
): Promise<RevenueTrendPoint[]> {
  const days = lastSevenCalendarDays();
  const { startIso } = getDayBoundsIso(days[0]);
  const { endIsoExclusive } = getDayBoundsIso(days[days.length - 1]);
  const supabase = createClient();

  const { data, error } = await supabase
    .from("payments")
    .select("amount, paid_at")
    .eq("business_id", businessId)
    .eq("status", "paid")
    .not("paid_at", "is", null)
    .gte("paid_at", startIso)
    .lt("paid_at", endIsoExclusive);

  if (error) {
    console.error("getRevenueTrend7Days:", error.message);
    return days.map((day) => ({
      day,
      label: shortWeekdayLabel(day),
      amount: 0,
    }));
  }

  const totals = new Map<string, number>(days.map((day) => [day, 0]));

  for (const row of data ?? []) {
    if (!row.paid_at) continue;
    const day = calendarDayInTimezone(row.paid_at);
    if (!totals.has(day)) continue;
    totals.set(day, (totals.get(day) ?? 0) + Number(row.amount ?? 0));
  }

  return days.map((day) => ({
    day,
    label: shortWeekdayLabel(day),
    amount: totals.get(day) ?? 0,
  }));
}

export async function getTopServices30Days(
  businessId: string
): Promise<TopServicePoint[]> {
  const today = todayCalendarDay();
  const startDay = addCalendarDays(today, -29);
  const { startIso } = getDayBoundsIso(startDay);
  const { endIsoExclusive } = getDayBoundsIso(today);
  const supabase = createClient();

  const { data, error } = await supabase
    .from("appointments")
    .select("service_name")
    .eq("business_id", businessId)
    .eq("payment_status", "paid")
    .neq("status", "cancelled")
    .gte("start_time", startIso)
    .lt("start_time", endIsoExclusive);

  if (error) {
    console.error("getTopServices30Days:", error.message);
    return [];
  }

  const counts = new Map<string, number>();

  for (const row of data ?? []) {
    const name = row.service_name?.trim();
    if (!name) continue;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 5);
}

export async function getDashboardAnalytics(
  businessId?: string | null
): Promise<DashboardAnalyticsData> {
  if (!businessId) {
    return EMPTY_ANALYTICS;
  }

  const [revenueTrend, topServices, heatmap] = await Promise.all([
    getRevenueTrend7Days(businessId),
    getTopServices30Days(businessId),
    buildDemandHeatmap(businessId),
  ]);

  return {
    revenueTrend,
    topServices,
    heatmapRows: heatmap.rows,
    showHeatmap: heatmap.showHeatmap,
  };
}
