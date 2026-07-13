import {
  getOutstandingAdvancesByStaff,
  roundMoney,
  normalizeStaffName,
} from "@/lib/staff/advances";
import { getOutstandingFinesByStaff } from "@/lib/staff/fines";
import type { StaffPayoutsSummary } from "@/lib/staff/types";
import { createClient } from "@/lib/supabase/server";

const EMPTY_PAYOUTS: StaffPayoutsSummary = {
  rows: [],
  totalGrossUnpaid: 0,
  totalFineOutstanding: 0,
  totalAdvanceOutstanding: 0,
  totalNetPayable: 0,
  totalUnpaid: 0,
};

type UnpaidEarningRow = {
  staff_name: string;
  commission_amount: number | string;
};

export async function getStaffPayouts(
  businessId: string,
  startIso?: string,
  endIsoExclusive?: string
): Promise<StaffPayoutsSummary> {
  const supabase = createClient();

  // Commission earned within the selected range (when bounds provided);
  // advances and fines remain outstanding balances (all-time).
  let earningsQuery = supabase
    .from("staff_earnings")
    .select("staff_name, commission_amount")
    .eq("business_id", businessId)
    .eq("status", "unpaid");

  if (startIso && endIsoExclusive) {
    earningsQuery = earningsQuery
      .gte("earned_at", startIso)
      .lt("earned_at", endIsoExclusive);
  }

  const [{ data, error }, advanceByStaff, fineByStaff] = await Promise.all([
    earningsQuery,
    getOutstandingAdvancesByStaff(businessId),
    getOutstandingFinesByStaff(businessId),
  ]);

  if (error) {
    console.error("getStaffPayouts:", error.message);
    return EMPTY_PAYOUTS;
  }

  const grossByStaff = new Map<string, number>();

  for (const row of (data ?? []) as UnpaidEarningRow[]) {
    const staffName = normalizeStaffName(row.staff_name);
    const amount = Number(row.commission_amount ?? 0);
    grossByStaff.set(staffName, (grossByStaff.get(staffName) ?? 0) + amount);
  }

  const staffNames = new Set<string>([
    ...Array.from(grossByStaff.keys()),
    ...Array.from(advanceByStaff.keys()),
    ...Array.from(fineByStaff.keys()),
  ]);

  const rows = Array.from(staffNames)
    .map((staffName) => {
      const grossUnpaid = roundMoney(grossByStaff.get(staffName) ?? 0);
      const fineOutstanding = roundMoney(fineByStaff.get(staffName) ?? 0);
      const advanceOutstanding = roundMoney(advanceByStaff.get(staffName) ?? 0);
      const netPayable = roundMoney(
        Math.max(0, grossUnpaid - fineOutstanding - advanceOutstanding)
      );

      return {
        staffName,
        grossUnpaid,
        fineOutstanding,
        advanceOutstanding,
        netPayable,
        unpaidAmount: grossUnpaid,
      };
    })
    .filter(
      (row) =>
        row.grossUnpaid > 0 ||
        row.advanceOutstanding > 0 ||
        row.fineOutstanding > 0
    )
    .sort((a, b) => b.netPayable - a.netPayable || b.grossUnpaid - a.grossUnpaid);

  const totalGrossUnpaid = roundMoney(
    rows.reduce((sum, row) => sum + row.grossUnpaid, 0)
  );
  const totalFineOutstanding = roundMoney(
    rows.reduce((sum, row) => sum + row.fineOutstanding, 0)
  );
  const totalAdvanceOutstanding = roundMoney(
    rows.reduce((sum, row) => sum + row.advanceOutstanding, 0)
  );
  const totalNetPayable = roundMoney(
    rows.reduce((sum, row) => sum + row.netPayable, 0)
  );

  return {
    rows,
    totalGrossUnpaid,
    totalFineOutstanding,
    totalAdvanceOutstanding,
    totalNetPayable,
    totalUnpaid: totalGrossUnpaid,
  };
}

export async function getGrossUnpaidCommissionForStaff(
  businessId: string,
  staffName: string
): Promise<number> {
  const supabase = createClient();
  const normalizedName = normalizeStaffName(staffName);

  const { data, error } = await supabase
    .from("staff_earnings")
    .select("commission_amount")
    .eq("business_id", businessId)
    .eq("staff_name", normalizedName)
    .eq("status", "unpaid");

  if (error) {
    console.error("getGrossUnpaidCommissionForStaff:", error.message);
    return 0;
  }

  const total = (data ?? []).reduce(
    (sum, row) => sum + Number((row as { commission_amount: number | string }).commission_amount ?? 0),
    0
  );

  return roundMoney(total);
}
