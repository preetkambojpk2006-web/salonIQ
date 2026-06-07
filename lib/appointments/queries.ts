import type { CustomerReliability } from "@/lib/customers/types";
import { getOwnerBusinessId } from "@/lib/customers/queries";
import type {
  Appointment,
  AppointmentPaymentMethod,
  AppointmentStatus,
} from "@/lib/appointments/types";
import { createClient } from "@/lib/supabase/server";

type PaymentJoin = {
  method: string;
  status: string;
  amount: number | string;
  paid_at: string | null;
  created_at: string;
};

type AppointmentRow = {
  id: string;
  business_id: string;
  branch_id: string | null;
  customer_id: string | null;
  staff_name: string | null;
  service_name: string | null;
  start_time: string;
  end_time: string | null;
  status: string;
  notes: string | null;
  total_amount: number | string;
  payment_status: string;
  source: string;
  created_at: string;
  customers:
    | { name: string; phone: string | null; reliability: string | null }
    | { name: string; phone: string | null; reliability: string | null }[]
    | null;
  branches: { address: string | null } | { address: string | null }[] | null;
  payments: PaymentJoin | PaymentJoin[] | null;
};

function latestPaymentMethod(
  payments: PaymentJoin | PaymentJoin[] | null
): AppointmentPaymentMethod | null {
  if (!payments) return null;

  const list = Array.isArray(payments) ? payments : [payments];
  if (list.length === 0) return null;

  const sorted = [...list].sort((a, b) => {
    const aTime = a.paid_at ?? a.created_at;
    const bTime = b.paid_at ?? b.created_at;
    return bTime.localeCompare(aTime);
  });

  const paid = sorted.find((p) => p.status === "paid");
  const chosen = paid ?? sorted[0];
  const method = chosen.method;

  if (method === "cash" || method === "upi" || method === "card" || method === "pending") {
    return method;
  }

  return null;
}

function mapRow(row: AppointmentRow): Appointment {
  const customer = row.customers;
  const customerName = Array.isArray(customer)
    ? customer[0]?.name ?? null
    : customer?.name ?? null;
  const customerPhone = Array.isArray(customer)
    ? customer[0]?.phone ?? null
    : customer?.phone ?? null;
  const rawReliability = Array.isArray(customer)
    ? customer[0]?.reliability ?? null
    : customer?.reliability ?? null;
  const customerReliability =
    rawReliability === "warning" ||
    rawReliability === "blacklisted" ||
    rawReliability === "good"
      ? (rawReliability as CustomerReliability)
      : null;

  const branch = row.branches;
  const branchAddress = Array.isArray(branch)
    ? branch[0]?.address ?? null
    : branch?.address ?? null;

  return {
    id: row.id,
    business_id: row.business_id,
    branch_id: row.branch_id,
    customer_id: row.customer_id,
    staff_name: row.staff_name,
    service_name: row.service_name,
    start_time: row.start_time,
    end_time: row.end_time,
    status: row.status as AppointmentStatus,
    notes: row.notes,
    total_amount: Number(row.total_amount ?? 0),
    payment_status: row.payment_status as Appointment["payment_status"],
    source: row.source,
    created_at: row.created_at,
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_reliability: customerReliability,
    branch_address: branchAddress,
    payment_method: latestPaymentMethod(row.payments),
  };
}

export async function listAppointments(): Promise<Appointment[]> {
  const supabase = createClient();
  const businessId = await getOwnerBusinessId();

  if (!businessId) {
    return [];
  }

  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      *,
      customers ( name, phone, reliability ),
      branches ( address ),
      payments ( method, status, amount, paid_at, created_at )
    `
    )
    .eq("business_id", businessId)
    .order("start_time", { ascending: true });

  if (error) {
    console.error("listAppointments:", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapRow(row as AppointmentRow));
}
