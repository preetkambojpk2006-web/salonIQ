import { getOwnerBusinessId } from "@/lib/customers/queries";
import {
  calendarDayInTimezone,
  getDayBoundsIso,
  mondayOfWeekCalendarDay,
  todayCalendarDay,
} from "@/lib/payments/date-utils";
import type {
  CashUpiSplit,
  MoneyDashboardStats,
  Payment,
} from "@/lib/payments/types";
import { createClient } from "@/lib/supabase/server";

function sumAmounts(rows: { amount: number | string }[] | null): number {
  return (rows ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
}

async function sumPaidToday(businessId: string): Promise<number> {
  const supabase = createClient();
  const today = todayCalendarDay();

  const { data: rpcTotal, error: rpcError } = await supabase.rpc(
    "sum_paid_payments_today",
    { p_business_id: businessId }
  );

  if (!rpcError && rpcTotal !== null && rpcTotal !== undefined) {
    return Number(rpcTotal);
  }

  if (rpcError) {
    console.error("sumPaidToday rpc:", rpcError.message);
  }

  const { data, error } = await supabase
    .from("payments")
    .select("amount, paid_at")
    .eq("business_id", businessId)
    .eq("status", "paid")
    .not("paid_at", "is", null);

  if (error) {
    console.error("sumPaidToday:", error.message);
    return 0;
  }

  const todayRows = (data ?? []).filter(
    (row) => row.paid_at && calendarDayInTimezone(row.paid_at) === today
  );

  if (todayRows.length > 0) {
    return sumAmounts(todayRows);
  }

  const { startIso, endIsoExclusive } = getDayBoundsIso(today);
  const { data: ranged, error: rangeError } = await supabase
    .from("payments")
    .select("amount")
    .eq("business_id", businessId)
    .eq("status", "paid")
    .not("paid_at", "is", null)
    .gte("paid_at", startIso)
    .lt("paid_at", endIsoExclusive);

  if (rangeError) {
    console.error("sumPaidToday range:", rangeError.message);
    return 0;
  }

  return sumAmounts(ranged);
}

async function sumPaidSinceWeekStart(businessId: string): Promise<number> {
  const supabase = createClient();
  const weekStart = mondayOfWeekCalendarDay();
  const { startIso } = getDayBoundsIso(weekStart);

  const { data, error } = await supabase
    .from("payments")
    .select("amount")
    .eq("business_id", businessId)
    .eq("status", "paid")
    .not("paid_at", "is", null)
    .gte("paid_at", startIso);

  if (error) {
    console.error("sumPaidSinceWeekStart:", error.message);
    return 0;
  }

  return sumAmounts(data);
}

async function sumUnpaid(businessId: string): Promise<{
  pendingAmount: number;
  pendingCount: number;
}> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("payments")
    .select("amount")
    .eq("business_id", businessId)
    .eq("status", "unpaid");

  if (error) {
    console.error("sumUnpaid:", error.message);
    return { pendingAmount: 0, pendingCount: 0 };
  }

  return {
    pendingAmount: sumAmounts(data),
    pendingCount: data?.length ?? 0,
  };
}

async function fetchPaymentMethodCounts(businessId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("method")
    .eq("business_id", businessId);

  if (error) {
    console.error("fetchPaymentMethodCounts:", error.message);
    return { cashCount: 0, upiCount: 0, pendingMethodCount: 0 };
  }

  let cashCount = 0;
  let upiCount = 0;
  let pendingMethodCount = 0;

  for (const row of data ?? []) {
    if (row.method === "cash") cashCount += 1;
    else if (row.method === "upi") upiCount += 1;
    else if (row.method === "pending") pendingMethodCount += 1;
  }

  return { cashCount, upiCount, pendingMethodCount };
}

const EMPTY_CASH_UPI_SPLIT: CashUpiSplit = {
  cash: 0,
  upi: 0,
  total: 0,
  cashPercent: 0,
  upiPercent: 0,
};

export async function getCashUpiSplit(
  businessId: string,
  dateFrom: Date,
  dateTo: Date
): Promise<CashUpiSplit> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("payments")
    .select("amount, method")
    .eq("business_id", businessId)
    .eq("status", "paid")
    .not("paid_at", "is", null)
    .gte("paid_at", dateFrom.toISOString())
    .lt("paid_at", dateTo.toISOString());

  if (error) {
    console.error("getCashUpiSplit:", error.message);
    return EMPTY_CASH_UPI_SPLIT;
  }

  let cash = 0;
  let upi = 0;

  for (const row of data ?? []) {
    const amount = Number(row.amount ?? 0);
    if (row.method === "cash") {
      cash += amount;
    } else if (row.method === "upi") {
      upi += amount;
    }
  }

  const total = cash + upi;
  const cashPercent = total > 0 ? Math.round((cash / total) * 100) : 0;
  const upiPercent = total > 0 ? Math.round((upi / total) * 100) : 0;

  return { cash, upi, total, cashPercent, upiPercent };
}

export async function getMoneyDashboardStats(): Promise<MoneyDashboardStats> {
  const empty: MoneyDashboardStats = {
    revenueToday: 0,
    revenueWeek: 0,
    pendingAmount: 0,
    pendingCount: 0,
    cashCount: 0,
    upiCount: 0,
    pendingMethodCount: 0,
    expensesPlaceholder: 0,
    netProfit: 0,
  };

  const businessId = await getOwnerBusinessId();
  if (!businessId) return empty;

  const [revenueToday, revenueWeek, unpaid, methodCounts] = await Promise.all([
    sumPaidToday(businessId),
    sumPaidSinceWeekStart(businessId),
    sumUnpaid(businessId),
    fetchPaymentMethodCounts(businessId),
  ]);

  const expensesPlaceholder = 0;

  return {
    revenueToday,
    revenueWeek,
    pendingAmount: unpaid.pendingAmount,
    pendingCount: unpaid.pendingCount,
    ...methodCounts,
    expensesPlaceholder,
    netProfit: revenueWeek - expensesPlaceholder,
  };
}

export async function getTodayPaymentTotals(
  businessId?: string | null
): Promise<{
  revenueToday: number;
  pendingAmount: number;
  pendingCount: number;
}> {
  const resolvedId = businessId ?? (await getOwnerBusinessId());
  if (!resolvedId) {
    return { revenueToday: 0, pendingAmount: 0, pendingCount: 0 };
  }

  const [revenueToday, unpaid] = await Promise.all([
    sumPaidToday(resolvedId),
    sumUnpaid(resolvedId),
  ]);

  return {
    revenueToday,
    pendingAmount: unpaid.pendingAmount,
    pendingCount: unpaid.pendingCount,
  };
}

export async function listRecentPayments(limit = 10): Promise<Payment[]> {
  const businessId = await getOwnerBusinessId();
  if (!businessId) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("listRecentPayments:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    ...row,
    amount: Number(row.amount ?? 0),
  }));
}
