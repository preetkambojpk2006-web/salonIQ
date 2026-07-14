export type StaffEarningStatus = "unpaid" | "paid";

export type StaffAdvanceStatus = "outstanding" | "settled";

export type StaffEarning = {
  id: string;
  business_id: string;
  staff_name: string;
  appointment_id: string | null;
  service_amount: number;
  commission_percent: number;
  commission_amount: number;
  earned_at: string;
  status: StaffEarningStatus;
};

export type StaffAdvance = {
  id: string;
  business_id: string;
  staff_name: string;
  staff_id: string | null;
  amount: number;
  note: string | null;
  given_at: string;
  status: StaffAdvanceStatus;
  settled_at: string | null;
  created_at: string;
};

export type StaffPayoutRow = {
  staffName: string;
  grossUnpaid: number;
  fineOutstanding: number;
  advanceOutstanding: number;
  netPayable: number;
  /** Gross unpaid commission — kept for existing Money UI until Step 3 refresh */
  unpaidAmount: number;
};

export type StaffPayoutsSummary = {
  rows: StaffPayoutRow[];
  totalGrossUnpaid: number;
  totalFineOutstanding: number;
  totalAdvanceOutstanding: number;
  totalNetPayable: number;
  /** Gross unpaid total — kept for existing Money UI until Step 3 refresh */
  totalUnpaid: number;
};

export type RecordStaffAdvanceResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export type SettleStaffPayoutResult =
  | {
      ok: true;
      grossUnpaid: number;
      fineApplied: number;
      advanceApplied: number;
      netPaid: number;
    }
  | { ok: false; error: string };

export type StaffSettlementRecord = {
  id: string;
  businessId: string;
  staffName: string;
  settledAt: string;
  grossCommission: number;
  finesDeducted: number;
  advancesDeducted: number;
  netPaid: number;
  note: string | null;
  createdBy: string | null;
  createdAt: string;
};

export type MissingCommissionAppointment = {
  appointmentId: string;
  staffName: string;
  serviceName: string | null;
  totalAmount: number;
  startTime: string;
};

export type RetryCommissionResult = { ok: true } | { ok: false; error: string };
