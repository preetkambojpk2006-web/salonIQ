import { normalizeStaffName } from "@/lib/staff/advances";
import type { StaffSettlementRecord } from "@/lib/staff/types";
import { createClient } from "@/lib/supabase/server";

type SettlementHistoryRow = {
  id: string;
  business_id: string;
  staff_name: string;
  settled_at: string;
  gross_commission: number | string;
  fines_deducted: number | string;
  advances_deducted: number | string;
  net_paid: number | string;
  note: string | null;
  created_by: string | null;
  created_at: string;
};

function mapSettlementRow(row: SettlementHistoryRow): StaffSettlementRecord {
  return {
    id: row.id,
    businessId: row.business_id,
    staffName: row.staff_name,
    settledAt: row.settled_at,
    grossCommission: Number(row.gross_commission ?? 0),
    finesDeducted: Number(row.fines_deducted ?? 0),
    advancesDeducted: Number(row.advances_deducted ?? 0),
    netPaid: Number(row.net_paid ?? 0),
    note: row.note,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export async function recordSettlementHistory(input: {
  businessId: string;
  staffName: string;
  settledAt: string;
  grossCommission: number;
  finesDeducted: number;
  advancesDeducted: number;
  netPaid: number;
  note?: string | null;
  createdBy: string;
}): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from("staff_settlement_history").insert({
    business_id: input.businessId,
    staff_name: input.staffName,
    settled_at: input.settledAt,
    gross_commission: input.grossCommission,
    fines_deducted: input.finesDeducted,
    advances_deducted: input.advancesDeducted,
    net_paid: input.netPaid,
    note: input.note?.trim() || null,
    created_by: input.createdBy,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function listStaffSettlementHistory(
  businessId: string,
  staffName: string
): Promise<StaffSettlementRecord[]> {
  const supabase = createClient();
  const normalizedName = normalizeStaffName(staffName);

  const { data, error } = await supabase
    .from("staff_settlement_history")
    .select("*")
    .eq("business_id", businessId)
    .eq("staff_name", normalizedName)
    .order("settled_at", { ascending: false });

  if (error) {
    console.error("listStaffSettlementHistory:", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapSettlementRow(row as SettlementHistoryRow));
}
