export type PaymentMethod = "cash" | "upi" | "card" | "pending";
export type PaymentRecordStatus = "paid" | "unpaid" | "partial";

export type Payment = {
  id: string;
  business_id: string;
  appointment_id: string | null;
  customer_name: string | null;
  amount: number;
  method: PaymentMethod;
  status: PaymentRecordStatus;
  paid_at: string | null;
  created_at: string;
};

export type CashUpiSplit = {
  cash: number;
  upi: number;
  total: number;
  cashPercent: number;
  upiPercent: number;
};

export type MoneyDashboardStats = {
  revenueToday: number;
  revenueWeek: number;
  pendingAmount: number;
  pendingCount: number;
  cashCount: number;
  upiCount: number;
  pendingMethodCount: number;
  expensesPlaceholder: number;
  netProfit: number;
};
