import {
  sortSlabs,
  type CommissionSlab,
} from "@/lib/commission/slab-calculations";
import { SALON_TIMEZONE, todayCalendarDay } from "@/lib/payments/date-utils";
import { createClient } from "@/lib/supabase/server";

export const STAFF_NUDGE_GAP_THRESHOLD = 2000;
export const STAFF_NUDGE_MAX = 3;

export type StaffIncentiveNudge = {
  staffName: string;
  currentRevenue: number;
  nextThreshold: number;
  nextRate: number;
  gap: number;
};

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

function findNextSlab(
  currentRevenue: number,
  slabs: CommissionSlab[]
): { nextThreshold: number; nextRate: number } | null {
  if (slabs.length === 0) return null;

  const sorted = sortSlabs(slabs);

  for (const slab of sorted) {
    if (currentRevenue < slab.min_amount) {
      return { nextThreshold: slab.min_amount, nextRate: slab.rate };
    }
  }

  return null;
}

function resolveSlabsForStaff(
  staffId: string,
  defaultSlabs: CommissionSlab[],
  overridesByStaffId: Map<string, CommissionSlab[]>
): CommissionSlab[] {
  const override = overridesByStaffId.get(staffId);
  if (override && override.length > 0) {
    return override;
  }
  return defaultSlabs;
}

export async function getStaffIncentiveNudges(
  businessId: string
): Promise<StaffIncentiveNudge[]> {
  const supabase = createClient();
  const monthStartIso = getCurrentMonthStartIso();

  const [
    { data: settings, error: settingsError },
    { data: staffRows, error: staffError },
    { data: earningRows, error: earningsError },
    { data: slabRows, error: slabsError },
  ] = await Promise.all([
    supabase
      .from("commission_settings")
      .select("mode")
      .eq("business_id", businessId)
      .maybeSingle(),
    supabase
      .from("staff")
      .select("id, name")
      .eq("business_id", businessId)
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("staff_earnings")
      .select("staff_name, service_amount")
      .eq("business_id", businessId)
      .gte("earned_at", monthStartIso),
    supabase
      .from("commission_slabs")
      .select("staff_id, min_amount, max_amount, rate")
      .eq("business_id", businessId)
      .order("min_amount", { ascending: true }),
  ]);

  if (settingsError) {
    console.error("getStaffIncentiveNudges settings:", settingsError.message);
  }
  if (staffError) {
    console.error("getStaffIncentiveNudges staff:", staffError.message);
    return [];
  }
  if (earningsError) {
    console.error("getStaffIncentiveNudges earnings:", earningsError.message);
  }
  if (slabsError) {
    console.error("getStaffIncentiveNudges slabs:", slabsError.message);
  }

  if (settings?.mode !== "slab") {
    return [];
  }

  const defaultSlabs = mapDbSlabs(
    (slabRows ?? []).filter((row) => row.staff_id == null)
  );

  if (defaultSlabs.length === 0) {
    return [];
  }

  const overridesByStaffId = new Map<string, CommissionSlab[]>();
  for (const row of slabRows ?? []) {
    if (!row.staff_id) continue;
    const existing = overridesByStaffId.get(row.staff_id) ?? [];
    existing.push({
      min_amount: Number(row.min_amount),
      max_amount: row.max_amount != null ? Number(row.max_amount) : null,
      rate: Number(row.rate),
    });
    overridesByStaffId.set(row.staff_id, existing);
  }

  for (const staffId of Array.from(overridesByStaffId.keys())) {
    overridesByStaffId.set(staffId, sortSlabs(overridesByStaffId.get(staffId) ?? []));
  }

  const revenueByStaffName = new Map<string, number>();
  for (const row of earningRows ?? []) {
    const name = row.staff_name?.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    revenueByStaffName.set(
      key,
      (revenueByStaffName.get(key) ?? 0) +
        Math.max(0, Number(row.service_amount ?? 0))
    );
  }

  const nudges: StaffIncentiveNudge[] = [];

  for (const staff of staffRows ?? []) {
    const staffName = staff.name.trim();
    if (!staffName) continue;

    const currentRevenue = revenueByStaffName.get(staffName.toLowerCase()) ?? 0;
    const slabs = resolveSlabsForStaff(
      staff.id,
      defaultSlabs,
      overridesByStaffId
    );
    const next = findNextSlab(currentRevenue, slabs);

    if (!next) continue;

    const gap = next.nextThreshold - currentRevenue;
    if (gap <= 0 || gap > STAFF_NUDGE_GAP_THRESHOLD) continue;

    nudges.push({
      staffName,
      currentRevenue,
      nextThreshold: next.nextThreshold,
      nextRate: next.nextRate,
      gap,
    });
  }

  return nudges
    .sort((a, b) => a.gap - b.gap || a.staffName.localeCompare(b.staffName))
    .slice(0, STAFF_NUDGE_MAX);
}
