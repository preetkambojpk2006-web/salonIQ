import { createClient } from "@/lib/supabase/server";

const DEFAULT_COMMISSION_PERCENT = 30;

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
): Promise<number> {
  if (staffName === "Unassigned") {
    return DEFAULT_COMMISSION_PERCENT;
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
    return DEFAULT_COMMISSION_PERCENT;
  }

  const percent = Number(data?.commission_percent);
  if (!Number.isFinite(percent)) {
    return DEFAULT_COMMISSION_PERCENT;
  }

  return percent;
}

export async function recordStaffCommissionForPayment(params: {
  businessId: string;
  appointmentId: string;
  staffName: string | null;
  serviceAmount: number;
  earnedAt: string;
}): Promise<void> {
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
    return;
  }

  if (existing?.id) {
    return;
  }

  const commissionPercent = await resolveCommissionPercent(
    params.businessId,
    staffName
  );
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
  }
}
