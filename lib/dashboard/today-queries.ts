import { getOwnerBusinessId } from "@/lib/customers/queries";
import { formatTime12h } from "@/lib/format/time";
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
};

export type UpcomingAppointment = {
  id: string;
  time: string;
  customer: string;
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

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

function customerName(row: {
  customers: { name: string } | { name: string }[] | null;
}): string {
  const c = row.customers;
  if (Array.isArray(c)) return c[0]?.name ?? "Customer";
  return c?.name ?? "Customer";
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
    pendingContext: "Sab clear hai",
    repeatPercent: 0,
    repeatContext: "Customers add karte jayein",
  };

  const businessId = await getOwnerBusinessId();
  if (!businessId) {
    return { metrics: emptyMetrics, upcoming: [], liveFlow: [] };
  }

  const supabase = createClient();
  const nowIso = new Date().toISOString();
  const todayStart = startOfToday().toISOString();
  const todayEnd = endOfToday().toISOString();

  const [
    { data: todayAppointments },
    { data: upcomingRows },
    { data: recentRows },
    { data: customers },
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, status, total_amount, payment_status, start_time")
      .eq("business_id", businessId)
      .gte("start_time", todayStart)
      .lte("start_time", todayEnd),
    supabase
      .from("appointments")
      .select(
        `id, start_time, status, payment_status, service_name, staff_name, customers ( name )`
      )
      .eq("business_id", businessId)
      .gte("start_time", nowIso)
      .neq("status", "cancelled")
      .neq("status", "completed")
      .order("start_time", { ascending: true })
      .limit(3),
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
  ]);

  const paymentTotals = await getTodayPaymentTotals();

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
        : `${completedToday.length} done, ${upcomingToday.length} baaki`,
    revenueToday,
    revenueContext:
      revenueToday > 0
        ? "Paid collections today"
        : "Cash / UPI se revenue yahan dikhegi",
    pendingAmount,
    pendingCount,
    pendingContext:
      pendingCount === 0
        ? "Sab clear hai"
        : `${pendingCount} payment baaki`,
    repeatPercent,
    repeatContext:
      totalCustomers === 0
        ? "Customers add karte jayein"
        : `${repeatCustomers} of ${totalCustomers} repeat`,
  };

  const upcoming: UpcomingAppointment[] = (upcomingRows ?? []).map((row) => ({
    id: row.id,
    time: formatTime12h(row.start_time),
    customer: customerName(row),
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
