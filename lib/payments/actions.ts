"use server";

import { recordCustomerLoyaltyForPayment } from "@/lib/customers/loyalty";
import { getOwnerBusinessId } from "@/lib/customers/queries";
import type { PaymentMethod } from "@/lib/payments/types";
import { recordStaffCommissionForPayment } from "@/lib/staff/commission";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const VALID_METHODS: PaymentMethod[] = ["cash", "upi", "pending"];

/** Server-side cap on a single payment: ₹10 lakh. */
const MAX_PAYMENT_AMOUNT = 1_000_000;

export type RecordPaymentResult =
  | { ok: true; commissionWarning?: boolean }
  | { ok: false; error: string };

/** Translate RPC exception codes into the same user-facing messages as before. */
function mapPaymentRpcError(message: string): string {
  if (message.includes("APPOINTMENT_NOT_FOUND")) {
    return "Booking not found.";
  }
  if (message.includes("INVALID_STATUS")) {
    return "Is booking par payment record nahi ho sakti.";
  }
  if (message.includes("ALREADY_PAID")) {
    return "Paid booking ko pending mark nahi kar sakte.";
  }
  if (message.includes("INVALID_AMOUNT")) {
    return "Amount exceeds maximum allowed value.";
  }
  if (message.includes("NOT_AUTHORIZED")) {
    return "Aapko is booking par payment record karne ki permission nahi hai.";
  }
  return message;
}

export async function recordAppointmentPayment(
  formData: FormData
): Promise<RecordPaymentResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Please sign in again." };
  }

  const businessId = await getOwnerBusinessId();
  if (!businessId) {
    return { ok: false, error: "Set up your salon first." };
  }

  const appointmentId = (formData.get("appointment_id") as string)?.trim();
  const method = (formData.get("method") as string)?.trim() as PaymentMethod;

  if (!appointmentId || !VALID_METHODS.includes(method)) {
    return { ok: false, error: "Invalid payment request." };
  }

  const { data: appointment, error: fetchError } = await supabase
    .from("appointments")
    .select(
      "id, business_id, status, payment_status, total_amount, staff_name, customer_id, loyalty_counted_at, customers ( name )"
    )
    .eq("id", appointmentId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (fetchError) {
    console.error("recordAppointmentPayment fetch:", fetchError.message);
    return { ok: false, error: fetchError.message };
  }

  if (!appointment) {
    return { ok: false, error: "Booking not found." };
  }

  if (
    appointment.status === "cancelled" ||
    appointment.status === "no_show" ||
    appointment.status === "completed"
  ) {
    return { ok: false, error: "Is booking par payment record nahi ho sakti." };
  }

  const customers = appointment.customers as
    | { name: string }
    | { name: string }[]
    | null;
  const customerName = Array.isArray(customers)
    ? customers[0]?.name ?? null
    : customers?.name ?? null;

  const amountOverrideRaw = (formData.get("amount") as string)?.trim();
  let amount = Number(appointment.total_amount ?? 0);

  if (amountOverrideRaw) {
    const parsed = Number(amountOverrideRaw);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return { ok: false, error: "Invalid payment amount." };
    }
    amount = parsed;
  }

  if (!Number.isFinite(amount) || amount < 0) {
    return { ok: false, error: "Invalid payment amount." };
  }

  if (amount > MAX_PAYMENT_AMOUNT) {
    return { ok: false, error: "Amount exceeds maximum allowed value." };
  }

  const isPaid = method === "cash" || method === "upi";
  if (isPaid && amount < 0) {
    return { ok: false, error: "Paid amount 0 se kam nahi ho sakta." };
  }

  const now = new Date().toISOString();
  const rowBusinessId = appointment.business_id as string;

  if (!isPaid && appointment.payment_status === "paid") {
    return {
      ok: false,
      error: "Paid booking ko pending mark nahi kar sakte.",
    };
  }

  // Atomic RPC: payment upsert + appointment status update happen in one
  // DB transaction — either both writes land or neither does.
  const { error: rpcError } = await supabase.rpc(
    "record_appointment_payment_atomic",
    {
      p_appointment_id: appointmentId,
      p_business_id: rowBusinessId,
      p_amount: amount,
      p_method: method,
      p_customer_name: customerName,
      p_paid_at: now,
    }
  );

  if (rpcError) {
    console.error("recordAppointmentPayment rpc:", rpcError.message);
    return { ok: false, error: mapPaymentRpcError(rpcError.message) };
  }

  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/money");
  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard");

  let commissionWarning = false;

  if (isPaid) {
    const commissionResult = await recordStaffCommissionForPayment({
      businessId: rowBusinessId,
      appointmentId,
      staffName: appointment.staff_name as string | null,
      serviceAmount: amount,
      earnedAt: now,
    });

    if (!commissionResult.ok) {
      console.error(
        "recordStaffCommissionForPayment:",
        commissionResult.error
      );
      commissionWarning = true;
    }

    const customerId = appointment.customer_id as string | null;
    if (customerId) {
      void recordCustomerLoyaltyForPayment({
        businessId: rowBusinessId,
        appointmentId,
        customerId,
        amount,
        paidAt: now,
      }).catch((err) => {
        console.error("recordCustomerLoyaltyForPayment:", err);
      });
    }
  }

  return commissionWarning ? { ok: true, commissionWarning: true } : { ok: true };
}
