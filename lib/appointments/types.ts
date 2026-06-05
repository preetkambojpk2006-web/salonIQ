export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export type PaymentStatus = "unpaid" | "paid" | "partial";

export type AppointmentPaymentMethod = "cash" | "upi" | "card" | "pending";

export type Appointment = {
  id: string;
  business_id: string;
  branch_id: string | null;
  customer_id: string | null;
  staff_name: string | null;
  service_name: string | null;
  start_time: string;
  end_time: string | null;
  status: AppointmentStatus;
  notes: string | null;
  total_amount: number;
  payment_status: PaymentStatus;
  source: string;
  created_at: string;
  customer_name: string | null;
  payment_method: AppointmentPaymentMethod | null;
};

export type AppointmentInsert = {
  business_id: string;
  branch_id?: string | null;
  customer_id?: string | null;
  staff_name?: string | null;
  service_name?: string | null;
  start_time: string;
  end_time?: string | null;
  status?: AppointmentStatus;
  notes?: string | null;
  total_amount?: number;
  payment_status?: PaymentStatus;
  source?: string;
};
