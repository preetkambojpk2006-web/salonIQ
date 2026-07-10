import { getOwnerBusinessId } from "@/lib/customers/queries";
import { formatTime12hInSalon } from "@/lib/format/time";
import { getDayBoundsIso } from "@/lib/payments/date-utils";
import { getTodayPaymentTotals } from "@/lib/payments/queries";
import { createClient } from "@/lib/supabase/server";

export type TodayMetrics = {
  bookingsToday: number;
  bookingsContext: string;
  revenueToday: number;
  revenueContext: string;
  pendingAmount: number;
  pendingCount: number;
  pendingContext: string;
  repeatPercent: number;
  repeatContext: string;
  totalCustomers: number;
};

export type UpcomingAppointment = {
  id: string;
  time: string;
  customer: string;
  customerPhone: string | null;
  service: string;
  staff: string;
  status: string;
  payment_status: string;
};

export type LiveFlowItem = {
  id: string;
  label: string;
  detail: string;
};

function startOfToday(): string {
  return getDayBoundsIso().startIso;
}

function endOfToday(): string {
  return getDayBoundsIso().endIsoExclusive;
}

function formatRs(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatPendingContext(amount: number, count: number): string {
  if (count === 0) {
    return "Aaj ka saara hisaab clear hai!";
  }
  return `${formatRs(amount)} collect karna baaki hai`;
}

function customerName(row: {
  customers: { name: string } | { name: string }[] | null;
}): string {
  const c = row.customers;
  if (Array.isArray(c)) return c[0]?.name ?? "Customer";
  return c?.name ?? "Customer";
}

function customerPhone(row: {
  customers:
    | { name: string; phone?: string | null }
    | { name: string; phone?: string | null }[]
    | null;
}): string | null {
  const c = row.customers;
  const phone = Array.isArray(c) ? c[0]?.phone : c?.phone;
  const trimmed = phone?.trim();
  return trimmed || null;
}

export async function getTodayDashboardData(): Promise<{
  metrics: TodayMetrics;
  upcoming: UpcomingAppointment[];
  liveFlow: LiveFlowItem[];
}> {
  const emptyMetrics: TodayMetrics = {
    bookingsToday: 0,
    bookingsContext: "Aaj koi booking nahi",
    revenueToday: 0,
    revenueContext: "Complete appointments se revenue aayegi",
    pendingAmount: 0,
    pendingCount: 0,
    pendingContext: "Aaj ka saara hisaab clear hai!",
    repeatPercent: 0,
    repeatContext: "Customers add karte jayein",
    totalCustomers: 0,
  };

  const businessId = await getOwnerBusinessId();
  if (!businessId) {
    return { metrics: emptyMetrics, upcoming: [], liveFlow: [] };
  }

  const supabase = createClient();
  const nowIso = new Date().toISOString();
  const todayStart = startOfToday();
  const todayEnd = endOfToday();

  const [
    { data: todayAppointments },
    { data: upcomingRows },
    { data: recentRows },
    { data: customers },
    paymentTotals,
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, status, total_amount, payment_status, start_time")
      .eq("business_id", businessId)
      .gte("start_time", todayStart)
      .lt("start_time", todayEnd),
    supabase
      .from("appointments")
      .select(
        `id, start_time, status, payment_status, service_name, staff_name, customers ( name, phone )`
      )
      .eq("business_id", businessId)
      .gte("start_time", nowIso)
      .lt("start_time", todayEnd)
      .in("status", ["pending", "confirmed"])
      .order("start_time", { ascending: true })
      .limit(10),
    supabase
      .from("appointments")
      .select(
        `id, status, service_name, staff_name, created_at, start_time, customers ( name )`
      )
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("customers")
      .select("visit_count")
      .eq("business_id", businessId),
    getTodayPaymentTotals(businessId),
  ]);

  const today = todayAppointments ?? [];
  const activeToday = today.filter(
    (a) => a.status !== "cancelled" && a.status !== "no_show"
  );
  const completedToday = today.filter((a) => a.status === "completed");
  const upcomingToday = activeToday.filter(
    (a) => a.status !== "completed" && new Date(a.start_time) > new Date()
  );

  const revenueToday = paymentTotals.revenueToday;
  const pendingAmount = paymentTotals.pendingAmount;
  const pendingCount = paymentTotals.pendingCount;

  const totalCustomers = customers?.length ?? 0;
  const repeatCustomers =
    customers?.filter((c) => Number(c.visit_count ?? 0) > 1).length ?? 0;
  const repeatPercent =
    totalCustomers > 0
      ? Math.round((repeatCustomers / totalCustomers) * 100)
      : 0;

  const metrics: TodayMetrics = {
    bookingsToday: activeToday.length,
    bookingsContext:
      activeToday.length === 0
        ? "Aaj koi booking nahi"
        : `${completedToday.length} complete · ${upcomingToday.length} abhi baaki`,
    revenueToday,
    revenueContext:
      revenueToday > 0
        ? "Aaj ki paid collections"
        : "Cash / UPI payments yahan dikhengi",
    pendingAmount,
    pendingCount,
    pendingContext: formatPendingContext(pendingAmount, pendingCount),
    repeatPercent,
    repeatContext:
      totalCustomers === 0
        ? "Customers add karte jayein"
        : repeatPercent >= 50
          ? "Acchi customer loyalty"
          : `${repeatCustomers} of ${totalCustomers} repeat customers`,
    totalCustomers,
  };

  const upcoming: UpcomingAppointment[] = (upcomingRows ?? []).map((row) => ({
    id: row.id,
    time: formatTime12hInSalon(row.start_time),
    customer: customerName(row),
    customerPhone: customerPhone(row),
    service: row.service_name ?? "Service",
    staff: row.staff_name ?? "Team",
    status: row.status,
    payment_status: row.payment_status ?? "unpaid",
  }));

  const liveFlowLabels: Record<string, string> = {
    completed: "Appointment completed",
    confirmed: "Booking confirmed",
    pending: "New booking",
    cancelled: "Booking cancelled",
    no_show: "No show",
  };

  const liveFlow: LiveFlowItem[] = (recentRows ?? []).map((row) => ({
    id: row.id,
    label: liveFlowLabels[row.status] ?? "Booking update",
    detail: `${customerName(row)} · ${row.service_name ?? "Service"}`,
  }));

  return { metrics, upcoming, liveFlow };
}
