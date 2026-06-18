import {
  calculateMarginalCommission,
  type CommissionSlab,
  validateSlabs,
} from "@/lib/commission/slab-calculations";
import { SALON_TIMEZONE, todayCalendarDay } from "@/lib/payments/date-utils";
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

function getCurrentMonthStartIso(timeZone = SALON_TIMEZONE): string {
  const today = todayCalendarDay(timeZone);
  const [yearStr, monthStr] = today.split("-");
  const firstDay = `${yearStr}-${monthStr}-01`;
  return new Date(`${firstDay}T00:00:00+05:30`).toISOString();
}

function mapDbSlabs(
  rows: Array<{
    min_amount: number | string;
    max_amount: number | string | null;
    rate: number | string;
  }>
): CommissionSlab[] {
  return rows.map((row) => ({
    min_amount: Number(row.min_amount),
    max_amount: row.max_amount != null ? Number(row.max_amount) : null,
    rate: Number(row.rate),
  }));
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

async function resolveStaffId(
  businessId: string,
  staffName: string
): Promise<string | null> {
  if (staffName === "Unassigned") {
    return null;
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from("staff")
    .select("id")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .ilike("name", staffName)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("resolveStaffId:", error.message);
    return null;
  }

  return data?.id ?? null;
}

async function getCommissionMode(
  supabase: ReturnType<typeof createClient>,
  businessId: string
): Promise<"flat" | "slab"> {
  const { data, error } = await supabase
    .from("commission_settings")
    .select("mode")
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) {
    console.error("getCommissionMode:", error.message);
    return "flat";
  }

  return data?.mode === "slab" ? "slab" : "flat";
}

async function loadSlabsForStaff(
  supabase: ReturnType<typeof createClient>,
  businessId: string,
  staffId: string | null
): Promise<CommissionSlab[]> {
  if (staffId) {
    const { data: overrideRows, error: overrideError } = await supabase
      .from("commission_slabs")
      .select("min_amount, max_amount, rate")
      .eq("business_id", businessId)
      .eq("staff_id", staffId)
      .order("min_amount", { ascending: true });

    if (overrideError) {
      console.error("loadSlabsForStaff override:", overrideError.message);
      return [];
    }

    if (overrideRows && overrideRows.length > 0) {
      return mapDbSlabs(overrideRows);
    }
  }

  const { data: defaultRows, error: defaultError } = await supabase
    .from("commission_slabs")
    .select("min_amount, max_amount, rate")
    .eq("business_id", businessId)
    .is("staff_id", null)
    .order("min_amount", { ascending: true });

  if (defaultError) {
    console.error("loadSlabsForStaff default:", defaultError.message);
    return [];
  }

  return defaultRows ? mapDbSlabs(defaultRows) : [];
}

async function getMonthlyRevenueSoFar(
  supabase: ReturnType<typeof createClient>,
  businessId: string,
  staffName: string,
  earnedAt: string,
  appointmentId: string
): Promise<number> {
  const monthStartIso = getCurrentMonthStartIso();

  const { data, error } = await supabase
    .from("staff_earnings")
    .select("service_amount")
    .eq("business_id", businessId)
    .eq("staff_name", staffName)
    .gte("earned_at", monthStartIso)
    .lte("earned_at", earnedAt)
    .neq("appointment_id", appointmentId);

  if (error) {
    console.error("getMonthlyRevenueSoFar:", error.message);
    return 0;
  }

  return (data ?? []).reduce(
    (sum, row) => sum + Math.max(0, Number(row.service_amount ?? 0)),
    0
  );
}

/**
 * Tiered slab commission when commission_settings.mode = 'slab'.
 * Returns null to fall back to the existing flat % engine.
 */
async function tryComputeSlabCommission(
  supabase: ReturnType<typeof createClient>,
  params: {
    businessId: string;
    appointmentId: string;
    staffName: string;
    serviceAmount: number;
    earnedAt: string;
  }
): Promise<number | null> {
  const staffId = await resolveStaffId(params.businessId, params.staffName);
  const slabs = await loadSlabsForStaff(supabase, params.businessId, staffId);

  if (slabs.length === 0) {
    return null;
  }

  const validation = validateSlabs(slabs);
  if (!validation.valid) {
    console.warn(
      `Slab commission invalid for business ${params.businessId}: ${validation.error ?? "unknown"}`
    );
    return null;
  }

  const monthlyRevenueSoFar = await getMonthlyRevenueSoFar(
    supabase,
    params.businessId,
    params.staffName,
    params.earnedAt,
    params.appointmentId
  );

  return calculateMarginalCommission(
    monthlyRevenueSoFar,
    params.serviceAmount,
    slabs
  );
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

  // Default: flat % from staff.commission_percent (unchanged legacy behavior).
  let commissionAmount = roundMoney(
    serviceAmount * (commissionPercent / 100)
  );

  const mode = await getCommissionMode(supabase, params.businessId);

  // Slab mode: marginal tiers on monthly cumulative revenue; any failure → flat above.
  if (mode === "slab") {
    try {
      const slabAmount = await tryComputeSlabCommission(supabase, {
        businessId: params.businessId,
        appointmentId: params.appointmentId,
        staffName,
        serviceAmount,
        earnedAt: params.earnedAt,
      });

      if (slabAmount !== null) {
        commissionAmount = slabAmount;
      }
    } catch (err) {
      console.error("recordStaffCommissionForPayment slab fallback:", err);
    }
  }

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
