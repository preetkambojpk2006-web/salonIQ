import type { StaffFineRow } from "@/lib/attendance/types";
import { normalizeStaffName, roundMoney } from "@/lib/staff/advances";
import { createClient } from "@/lib/supabase/server";

type FineDbRow = {
  id: string;
  business_id: string;
  staff_id: string;
  staff_name: string;
  attendance_id: string | null;
  amount: number | string;
  reason: string;
  fine_date: string;
  status: string;
  deducted_at: string | null;
};

function mapFineRow(row: FineDbRow): StaffFineRow {
  return {
    id: row.id,
    business_id: row.business_id,
    staff_id: row.staff_id,
    staff_name: row.staff_name,
    attendance_id: row.attendance_id,
    amount: roundMoney(Number(row.amount ?? 0)),
    reason: row.reason,
    fine_date: row.fine_date,
    status: row.status === "deducted" ? "deducted" : "outstanding",
    deducted_at: row.deducted_at,
  };
}

export async function getOutstandingFines(
  businessId: string
): Promise<StaffFineRow[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("staff_fines")
    .select("*")
    .eq("business_id", businessId)
    .eq("status", "outstanding")
    .order("fine_date", { ascending: false });

  if (error) {
    console.error("getOutstandingFines:", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapFineRow(row as FineDbRow));
}

export async function getOutstandingFinesByStaff(
  businessId: string
): Promise<Map<string, number>> {
  const fines = await getOutstandingFines(businessId);
  const totals = new Map<string, number>();

  for (const fine of fines) {
    const staffName = normalizeStaffName(fine.staff_name);
    totals.set(staffName, roundMoney((totals.get(staffName) ?? 0) + fine.amount));
  }

  return totals;
}

export async function sumOutstandingFines(businessId: string): Promise<number> {
  const totals = await getOutstandingFinesByStaff(businessId);
  const total = Array.from(totals.values()).reduce((sum, value) => sum + value, 0);
  return roundMoney(total);
}

export async function listOutstandingFinesForStaff(
  businessId: string,
  staffName: string
): Promise<StaffFineRow[]> {
  const supabase = createClient();
  const normalizedName = normalizeStaffName(staffName);

  const { data, error } = await supabase
    .from("staff_fines")
    .select("*")
    .eq("business_id", businessId)
    .eq("staff_name", normalizedName)
    .eq("status", "outstanding")
    .order("fine_date", { ascending: true });

  if (error) {
    console.error("listOutstandingFinesForStaff:", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapFineRow(row as FineDbRow));
}

export async function voidOutstandingFinesForAttendance(
  businessId: string,
  attendanceId: string
): Promise<number> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("staff_fines")
    .delete()
    .eq("business_id", businessId)
    .eq("attendance_id", attendanceId)
    .eq("status", "outstanding")
    .select("id");

  if (error) {
    console.error("voidOutstandingFinesForAttendance:", error.message);
    return 0;
  }

  return data?.length ?? 0;
}

export async function createFineForLateAttendance(params: {
  businessId: string;
  staffId: string;
  staffName: string;
  attendanceId: string;
  fineDate: string;
  amount: number;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (params.amount <= 0) {
    return { ok: false, error: "Fine amount 0 hai." };
  }

  const supabase = createClient();

  const { data: existing } = await supabase
    .from("staff_fines")
    .select("id")
    .eq("business_id", params.businessId)
    .eq("attendance_id", params.attendanceId)
    .eq("status", "outstanding")
    .maybeSingle();

  if (existing?.id) {
    return { ok: true, id: existing.id };
  }

  const { data, error } = await supabase
    .from("staff_fines")
    .insert({
      business_id: params.businessId,
      staff_id: params.staffId,
      staff_name: normalizeStaffName(params.staffName),
      attendance_id: params.attendanceId,
      amount: roundMoney(params.amount),
      reason: "Late aana",
      fine_date: params.fineDate,
      status: "outstanding",
    })
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("createFineForLateAttendance:", error.message);
    return { ok: false, error: error.message };
  }

  if (!data?.id) {
    return { ok: false, error: "Fine record nahi bana." };
  }

  return { ok: true, id: data.id };
}

/**
 * FIFO: fully deduct outstanding fine rows while budget allows.
 */
export async function settleOutstandingFinesForStaff(params: {
  businessId: string;
  staffName: string;
  deductionBudget: number;
  deductedAt?: string;
}): Promise<number> {
  if (params.deductionBudget <= 0) {
    return 0;
  }

  const supabase = createClient();
  const deductedAt = params.deductedAt ?? new Date().toISOString();
  const fines = await listOutstandingFinesForStaff(
    params.businessId,
    params.staffName
  );

  let budget = roundMoney(params.deductionBudget);
  let applied = 0;

  for (const fine of fines) {
    if (budget <= 0) break;
    if (fine.amount > budget) {
      continue;
    }

    const { error } = await supabase
      .from("staff_fines")
      .update({
        status: "deducted",
        deducted_at: deductedAt,
      })
      .eq("id", fine.id)
      .eq("business_id", params.businessId)
      .eq("status", "outstanding");

    if (error) {
      console.error("settleOutstandingFinesForStaff:", error.message);
      break;
    }

    budget = roundMoney(budget - fine.amount);
    applied = roundMoney(applied + fine.amount);
  }

  return applied;
}
