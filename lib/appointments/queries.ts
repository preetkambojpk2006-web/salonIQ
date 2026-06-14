import type { CustomerReliability } from "@/lib/customers/types";
import { getOwnerBusinessId } from "@/lib/customers/queries";
import type {
  Appointment,
  AppointmentPaymentMethod,
  AppointmentStatus,
} from "@/lib/appointments/types";
import { getDayBoundsIso } from "@/lib/payments/date-utils";
import { createClient } from "@/lib/supabase/server";

type PaymentJoin = {
  method: string;
  status: string;
  amount: number | string;
  paid_at: string | null;
  created_at: string;
};

type CustomerJoin = {
  name: string;
  phone: string | null;
  reliability?: string | null;
  notes: string | null;
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
  customers: CustomerJoin | CustomerJoin[] | null;
  branches: { address: string | null } | { address: string | null }[] | null;
  payments?: PaymentJoin | PaymentJoin[] | null;
};

function latestPaymentMethod(
  payments: PaymentJoin | PaymentJoin[] | null | undefined
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
  const customerNotes = Array.isArray(customer)
    ? customer[0]?.notes ?? null
    : customer?.notes ?? null;

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
    customer_notes: customerNotes,
    customer_reliability: customerReliability,
    branch_address: branchAddress,
    payment_method: latestPaymentMethod(row.payments),
  };
}

/** All pending online requests for businesses the user can access (RLS-scoped). */
export async function listOnlinePendingAppointments(): Promise<Appointment[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      *,
      customers ( name, phone, notes ),
      branches ( address )
    `
    )
    .eq("status", "pending")
    .eq("source", "online")
    .order("start_time", { ascending: true });

  if (error) {
    console.error("listOnlinePendingAppointments:", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapRow(row as AppointmentRow));
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
      customers ( name, phone, notes ),
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

const APPOINTMENT_DETAIL_SELECT = `
  *,
  customers ( name, phone, notes ),
  branches ( address ),
  payments ( method, status, amount, paid_at, created_at )
`;

export async function getAppointmentById(
  id: string
): Promise<Appointment | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("appointments")
    .select(APPOINTMENT_DETAIL_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getAppointmentById:", error.message);
    return null;
  }

  if (!data) return null;

  return mapRow(data as AppointmentRow);
}

export async function listStaffDayAppointments(
  businessId: string,
  staffName: string,
  istDay: string
): Promise<Appointment[]> {
  const supabase = createClient();
  const trimmedStaff = staffName.trim();
  const { startIso, endIsoExclusive } = getDayBoundsIso(istDay);

  let query = supabase
    .from("appointments")
    .select(
      `
      *,
      customers ( name, phone, notes ),
      branches ( address )
    `
    )
    .eq("business_id", businessId)
    .gte("start_time", startIso)
    .lt("start_time", endIsoExclusive)
    .in("status", ["pending", "confirmed"])
    .order("start_time", { ascending: true });

  if (trimmedStaff) {
    query = query.ilike("staff_name", trimmedStaff);
  } else {
    query = query.or("staff_name.is.null,staff_name.eq.");
  }

  const { data, error } = await query;

  if (error) {
    console.error("listStaffDayAppointments:", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapRow(row as AppointmentRow));
}
