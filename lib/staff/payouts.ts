import type { StaffPayoutsSummary } from "@/lib/staff/types";
import { createClient } from "@/lib/supabase/server";

const EMPTY_PAYOUTS: StaffPayoutsSummary = {
  rows: [],
  totalUnpaid: 0,
};

type UnpaidEarningRow = {
  staff_name: string;
  commission_amount: number | string;
};

export async function getStaffPayouts(
  businessId: string
): Promise<StaffPayoutsSummary> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("staff_earnings")
    .select("staff_name, commission_amount")
    .eq("business_id", businessId)
    .eq("status", "unpaid");

  if (error) {
    console.error("getStaffPayouts:", error.message);
    return EMPTY_PAYOUTS;
  }

  const totalsByStaff = new Map<string, number>();

  for (const row of (data ?? []) as UnpaidEarningRow[]) {
    const staffName = row.staff_name?.trim() || "Unassigned";
    const amount = Number(row.commission_amount ?? 0);
    totalsByStaff.set(staffName, (totalsByStaff.get(staffName) ?? 0) + amount);
  }

  const rows = Array.from(totalsByStaff.entries())
    .map(([staffName, unpaidAmount]) => ({
      staffName,
      unpaidAmount: Math.round(unpaidAmount * 100) / 100,
    }))
    .sort((a, b) => b.unpaidAmount - a.unpaidAmount);

  const totalUnpaid = rows.reduce((sum, row) => sum + row.unpaidAmount, 0);

  return {
    rows,
    totalUnpaid: Math.round(totalUnpaid * 100) / 100,
  };
}
