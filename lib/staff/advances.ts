import type { StaffAdvance } from "@/lib/staff/types";
import { createClient } from "@/lib/supabase/server";

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function normalizeStaffName(staffName: string | null | undefined): string {
  const trimmed = staffName?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "Unassigned";
}

type StaffAdvanceRow = {
  id: string;
  business_id: string;
  staff_name: string;
  staff_id: string | null;
  amount: number | string;
  note: string | null;
  given_at: string;
  status: string;
  settled_at: string | null;
  created_at: string;
};

function mapAdvanceRow(row: StaffAdvanceRow): StaffAdvance {
  return {
    id: row.id,
    business_id: row.business_id,
    staff_name: row.staff_name,
    staff_id: row.staff_id,
    amount: roundMoney(Number(row.amount ?? 0)),
    note: row.note,
    given_at: row.given_at,
    status: row.status === "settled" ? "settled" : "outstanding",
    settled_at: row.settled_at,
    created_at: row.created_at,
  };
}

export async function listStaffAdvances(
  businessId: string,
  limit = 50
): Promise<StaffAdvance[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("staff_advances")
    .select("*")
    .eq("business_id", businessId)
    .order("given_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("listStaffAdvances:", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapAdvanceRow(row as StaffAdvanceRow));
}

export async function getOutstandingAdvancesByStaff(
  businessId: string
): Promise<Map<string, number>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("staff_advances")
    .select("staff_name, amount")
    .eq("business_id", businessId)
    .eq("status", "outstanding");

  if (error) {
    console.error("getOutstandingAdvancesByStaff:", error.message);
    return new Map();
  }

  const totals = new Map<string, number>();

  for (const row of data ?? []) {
    const staffName = normalizeStaffName(
      (row as { staff_name: string }).staff_name
    );
    const amount = Number((row as { amount: number | string }).amount ?? 0);
    totals.set(staffName, roundMoney((totals.get(staffName) ?? 0) + amount));
  }

  return totals;
}

export async function listOutstandingAdvancesForStaff(
  businessId: string,
  staffName: string
): Promise<StaffAdvance[]> {
  const supabase = createClient();
  const normalizedName = normalizeStaffName(staffName);

  const { data, error } = await supabase
    .from("staff_advances")
    .select("*")
    .eq("business_id", businessId)
    .eq("staff_name", normalizedName)
    .eq("status", "outstanding")
    .order("given_at", { ascending: true });

  if (error) {
    console.error("listOutstandingAdvancesForStaff:", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapAdvanceRow(row as StaffAdvanceRow));
}

export async function insertStaffAdvance(params: {
  businessId: string;
  staffName: string;
  staffId?: string | null;
  amount: number;
  note?: string | null;
  givenAt?: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = createClient();
  const staffName = normalizeStaffName(params.staffName);
  const amount = roundMoney(params.amount);

  if (amount <= 0) {
    return { ok: false, error: "Advance amount 0 se zyada hona chahiye." };
  }

  const { data, error } = await supabase
    .from("staff_advances")
    .insert({
      business_id: params.businessId,
      staff_name: staffName,
      staff_id: params.staffId ?? null,
      amount,
      note: params.note?.trim() || null,
      given_at: params.givenAt ?? new Date().toISOString(),
      status: "outstanding",
    })
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("insertStaffAdvance:", error.message);
    return { ok: false, error: error.message };
  }

  if (!data?.id) {
    return { ok: false, error: "Advance record nahi bana." };
  }

  return { ok: true, id: data.id };
}

/**
 * FIFO: fully settle outstanding advance rows while budget allows (no partial rows).
 * Returns total amount applied against commission.
 */
export async function settleOutstandingAdvancesForStaff(params: {
  businessId: string;
  staffName: string;
  deductionBudget: number;
  settledAt?: string;
}): Promise<number> {
  if (params.deductionBudget <= 0) {
    return 0;
  }

  const supabase = createClient();
  const settledAt = params.settledAt ?? new Date().toISOString();
  const advances = await listOutstandingAdvancesForStaff(
    params.businessId,
    params.staffName
  );

  let budget = roundMoney(params.deductionBudget);
  let applied = 0;

  for (const advance of advances) {
    if (budget <= 0) break;
    if (advance.amount > budget) {
      continue;
    }

    const { error } = await supabase
      .from("staff_advances")
      .update({
        status: "settled",
        settled_at: settledAt,
      })
      .eq("id", advance.id)
      .eq("business_id", params.businessId)
      .eq("status", "outstanding");

    if (error) {
      console.error("settleOutstandingAdvancesForStaff:", error.message);
      break;
    }

    budget = roundMoney(budget - advance.amount);
    applied = roundMoney(applied + advance.amount);
  }

  return applied;
}

export async function sumOutstandingAdvances(businessId: string): Promise<number> {
  const totals = await getOutstandingAdvancesByStaff(businessId);
  const total = Array.from(totals.values()).reduce((sum, value) => sum + value, 0);
  return roundMoney(total);
}
