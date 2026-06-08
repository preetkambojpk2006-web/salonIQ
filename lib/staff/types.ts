export type StaffEarningStatus = "unpaid" | "paid";

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

export type StaffPayoutRow = {
  staffName: string;
  unpaidAmount: number;
};

export type StaffPayoutsSummary = {
  rows: StaffPayoutRow[];
  totalUnpaid: number;
};
