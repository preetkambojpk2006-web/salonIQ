import { getOwnerBusinessId } from "@/lib/customers/queries";
import {
  addCalendarDays,
  getDayBoundsIso,
  mondayOfWeekCalendarDay,
  SALON_TIMEZONE,
  todayCalendarDay,
} from "@/lib/payments/date-utils";
import { createClient } from "@/lib/supabase/server";
import type {
  HeatmapRow,
  InsightCard,
  InsightsDashboardData,
} from "@/lib/insights/types";

export type {
  HeatmapRow,
  InsightCard,
  InsightCardTone,
  InsightsDashboardData,
} from "@/lib/insights/types";

const HEATMAP_TIME_LABELS = ["10a", "12p", "2p", "4p", "6p", "8p"] as const;

const EMPTY_DASHBOARD: InsightsDashboardData = {
  cards: [],
  heatmapRows: [],
  showHeatmap: false,
};

function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function dayOfWeekIndexMonFirst(iso: string): number {
  const short = new Intl.DateTimeFormat("en-US", {
    timeZone: SALON_TIMEZONE,
    weekday: "short",
  }).format(new Date(iso));
  const map: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  return map[short] ?? 0;
}

function hourInSalonTimezone(iso: string): number {
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone: SALON_TIMEZONE,
    hour: "numeric",
    hour12: false,
  }).format(new Date(iso));
  return Number.parseInt(hour, 10);
}

function heatmapSlotIndex(hour: number): number | null {
  if (hour >= 10 && hour < 12) return 0;
  if (hour >= 12 && hour < 14) return 1;
  if (hour >= 14 && hour < 16) return 2;
  if (hour >= 16 && hour < 18) return 3;
  if (hour >= 18 && hour < 20) return 4;
  if (hour >= 20 && hour < 22) return 5;
  return null;
}

function staffLabel(name: string | null | undefined): string {
  const trimmed = name?.trim();
  return trimmed || "Unassigned";
}

function isCountableAppointment(status: string): boolean {
  return status !== "cancelled";
}

async function countInactiveCustomers(businessId: string): Promise<number> {
  const supabase = createClient();
  const cutoffDay = addCalendarDays(todayCalendarDay(), -30);
  const { startIso: cutoffIso } = getDayBoundsIso(cutoffDay);

  const [customersRes, appointmentsRes] = await Promise.all([
    supabase
      .from("customers")
      .select("id, last_visit_at, visit_count")
      .eq("business_id", businessId),
    supabase
      .from("appointments")
      .select("customer_id, start_time, status")
      .eq("business_id", businessId)
      .not("customer_id", "is", null),
  ]);

  if (customersRes.error) {
    console.error("countInactiveCustomers customers:", customersRes.error.message);
    return 0;
  }
  if (appointmentsRes.error) {
    console.error("countInactiveCustomers appointments:", appointmentsRes.error.message);
    return 0;
  }

  const lastAppointmentByCustomer = new Map<string, string>();
  for (const row of appointmentsRes.data ?? []) {
    if (!row.customer_id || !isCountableAppointment(row.status)) continue;
    const existing = lastAppointmentByCustomer.get(row.customer_id);
    if (!existing || row.start_time > existing) {
      lastAppointmentByCustomer.set(row.customer_id, row.start_time);
    }
  }

  let inactiveCount = 0;
  for (const customer of customersRes.data ?? []) {
    const visitCount = Number(customer.visit_count ?? 0);
    const lastVisit =
      customer.last_visit_at ??
      lastAppointmentByCustomer.get(customer.id) ??
      null;

    if (!lastVisit) {
      if (visitCount === 0) {
        continue;
      }
      inactiveCount += 1;
      continue;
    }

    if (lastVisit < cutoffIso) {
      inactiveCount += 1;
    }
  }

  return inactiveCount;
}

async function sumPendingCollection(businessId: string): Promise<number> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("payments")
    .select("amount")
    .eq("business_id", businessId)
    .eq("status", "unpaid");

  if (error) {
    console.error("sumPendingCollection:", error.message);
    return 0;
  }

  return (data ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
}

type StaffLoad = {
  busyStaff: string;
  busyCount: number;
  freeStaff: string;
  freeCount: number;
} | null;

async function getTodayStaffLoad(businessId: string): Promise<StaffLoad> {
  const supabase = createClient();
  const { startIso, endIsoExclusive } = getDayBoundsIso();

  const { data, error } = await supabase
    .from("appointments")
    .select("staff_name")
    .eq("business_id", businessId)
    .gte("start_time", startIso)
    .lt("start_time", endIsoExclusive)
    .in("status", ["pending", "confirmed"]);

  if (error) {
    console.error("getTodayStaffLoad:", error.message);
    return null;
  }

  if (!data || data.length === 0) {
    return null;
  }

  const counts = new Map<string, number>();
  for (const row of data) {
    const label = staffLabel(row.staff_name);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  const entries = Array.from(counts.entries());
  if (entries.length === 0) {
    return null;
  }

  entries.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  const [busyStaff, busyCount] = entries[0];
  const [freeStaff, freeCount] = entries[entries.length - 1];

  if (entries.length === 1) {
    return { busyStaff, busyCount, freeStaff: busyStaff, freeCount: busyCount };
  }

  return { busyStaff, busyCount, freeStaff, freeCount };
}

export async function buildDemandHeatmap(businessId: string): Promise<{
  rows: HeatmapRow[];
  showHeatmap: boolean;
}> {
  const supabase = createClient();
  const today = mondayOfWeekCalendarDay();
  const eightWeeksAgo = addCalendarDays(today, -56);
  const { startIso } = getDayBoundsIso(eightWeeksAgo);

  const { data, error } = await supabase
    .from("appointments")
    .select("start_time, status")
    .eq("business_id", businessId)
    .gte("start_time", startIso)
    .neq("status", "cancelled");

  if (error) {
    console.error("buildDemandHeatmap:", error.message);
    return { rows: [], showHeatmap: false };
  }

  const grid = Array.from({ length: HEATMAP_TIME_LABELS.length }, () =>
    Array.from({ length: 7 }, () => 0)
  );

  let total = 0;
  for (const row of data ?? []) {
    const slot = heatmapSlotIndex(hourInSalonTimezone(row.start_time));
    if (slot === null) continue;
    const day = dayOfWeekIndexMonFirst(row.start_time);
    grid[slot][day] += 1;
    total += 1;
  }

  if (total === 0) {
    return { rows: [], showHeatmap: false };
  }

  return {
    showHeatmap: true,
    rows: HEATMAP_TIME_LABELS.map((time, slotIndex) => ({
      time,
      values: grid[slotIndex],
    })),
  };
}

function buildInactiveCard(count: number): InsightCard | null {
  if (count === 0) return null;

  return {
    id: "inactive-customers",
    title: "Inactive customers",
    body: `${count} inactive customer${count === 1 ? "" : "s"} hain — WhatsApp blast bhejo.`,
    tone: "mint",
  };
}

function buildPendingCard(amount: number): InsightCard | null {
  if (amount <= 0) return null;

  return {
    id: "pending-collection",
    title: "Pending UPI follow-up",
    body: `${formatInr(amount)} abhi collect nahi hua. Gentle reminder bhej sakte ho.`,
    tone: "amber",
  };
}

function buildStaffLoadCard(load: StaffLoad): InsightCard | null {
  if (!load) return null;

  if (load.busyStaff === load.freeStaff) {
    return {
      id: "staff-load",
      title: "Staff load balance",
      body: `Aaj ${load.busyStaff} ke paas ${load.busyCount} appointment${load.busyCount === 1 ? "" : "s"} hain.`,
      tone: "blue",
    };
  }

  return {
    id: "staff-load",
    title: "Staff load balance",
    body: `${load.busyStaff} busy hai (${load.busyCount} bookings) — ${load.freeStaff} ke paas zyada slots hain (${load.freeCount}). Walk-ins divert karo.`,
    tone: "blue",
  };
}

export async function getInsightsDashboardData(
  businessId?: string | null
): Promise<InsightsDashboardData> {
  const resolvedId = businessId ?? (await getOwnerBusinessId());
  if (!resolvedId) {
    return EMPTY_DASHBOARD;
  }

  const [inactiveCount, pendingAmount, staffLoad, heatmap] = await Promise.all([
    countInactiveCustomers(resolvedId),
    sumPendingCollection(resolvedId),
    getTodayStaffLoad(resolvedId),
    buildDemandHeatmap(resolvedId),
  ]);

  const cards = [
    buildInactiveCard(inactiveCount),
    buildPendingCard(pendingAmount),
    buildStaffLoadCard(staffLoad),
  ].filter((card): card is InsightCard => card !== null);

  return {
    cards,
    heatmapRows: heatmap.rows,
    showHeatmap: heatmap.showHeatmap,
  };
}
