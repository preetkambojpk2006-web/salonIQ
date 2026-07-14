import type { StaffPayoutRow } from "@/lib/staff/types";

const PAYOUT_CSV_HEADERS = [
  "Staff Name",
  "Commission Earned",
  "Fines Deducted",
  "Advances Deducted",
  "Net Payable",
];

export function buildPayoutCsvRows(
  rows: StaffPayoutRow[]
): (string | number | null)[][] {
  return rows.map((row) => [
    row.staffName,
    row.grossUnpaid,
    row.fineOutstanding,
    row.advanceOutstanding,
    row.netPayable,
  ]);
}

export { PAYOUT_CSV_HEADERS };
