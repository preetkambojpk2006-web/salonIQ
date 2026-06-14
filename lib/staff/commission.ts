import { createClient } from "@/lib/supabase/server";

const DEFAULT_COMMISSION_PERCENT = 30;

export type CommissionResult = { ok: true } | { ok: false; error: string };

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeStaffName(staffName: string | null | undefined): string {
  const trimmed = staffName?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "Unassigned";
}

async function resolveCommissionPercent(
  businessId: string,
  staffName: string
): Promise<{ percent: number; matched: boolean }> {
  if (staffName === "Unassigned") {
    return { percent: DEFAULT_COMMISSION_PERCENT, matched: false };
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from("staff")
    .select("commission_percent")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .ilike("name", staffName)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("resolveCommissionPercent:", error.message);
    return { percent: DEFAULT_COMMISSION_PERCENT, matched: false };
  }

  if (!data) {
    return { percent: DEFAULT_COMMISSION_PERCENT, matched: false };
  }

  const percent = Number(data.commission_percent);
  if (!Number.isFinite(percent)) {
    return { percent: DEFAULT_COMMISSION_PERCENT, matched: true };
  }

  return { percent, matched: true };
}

export async function recordStaffCommissionForPayment(params: {
  businessId: string;
  appointmentId: string;
  staffName: string | null;
  serviceAmount: number;
  earnedAt: string;
}): Promise<CommissionResult> {
  const supabase = createClient();
  const staffName = normalizeStaffName(params.staffName);
  const serviceAmount = Math.max(0, params.serviceAmount);

  const { data: existing, error: existingError } = await supabase
    .from("staff_earnings")
    .select("id")
    .eq("appointment_id", params.appointmentId)
    .eq("business_id", params.businessId)
    .maybeSingle();

  if (existingError) {
    console.error("recordStaffCommissionForPayment lookup:", existingError.message);
    return { ok: false, error: existingError.message };
  }

  if (existing?.id) {
    return { ok: true };
  }

  const { percent: commissionPercent, matched } = await resolveCommissionPercent(
    params.businessId,
    staffName
  );

  if (!matched && staffName !== "Unassigned") {
    console.warn(
      `Commission fallback for unmatched staff "${staffName}" on appointment ${params.appointmentId}`
    );
  }

  const commissionAmount = roundMoney(
    serviceAmount * (commissionPercent / 100)
  );

  const { error: insertError } = await supabase.from("staff_earnings").insert({
    business_id: params.businessId,
    staff_name: staffName,
    appointment_id: params.appointmentId,
    service_amount: serviceAmount,
    commission_percent: commissionPercent,
    commission_amount: commissionAmount,
    earned_at: params.earnedAt,
    status: "unpaid",
  });

  if (insertError) {
    console.error("recordStaffCommissionForPayment insert:", insertError.message);
    return { ok: false, error: insertError.message };
  }

  return { ok: true };
}
