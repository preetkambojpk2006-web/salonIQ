"use server";

import { recordCustomerLoyaltyForPayment } from "@/lib/customers/loyalty";
import { getOwnerBusinessId } from "@/lib/customers/queries";
import type { PaymentMethod } from "@/lib/payments/types";
import { recordStaffCommissionForPayment } from "@/lib/staff/commission";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const VALID_METHODS: PaymentMethod[] = ["cash", "upi", "pending"];

export type RecordPaymentResult =
  | { ok: true }
  | { ok: false; error: string };

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
      "id, business_id, total_amount, staff_name, customer_id, loyalty_counted_at, customers ( name )"
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

  const customers = appointment.customers as
    | { name: string }
    | { name: string }[]
    | null;
  const customerName = Array.isArray(customers)
    ? customers[0]?.name ?? null
    : customers?.name ?? null;

  const amount = Number(appointment.total_amount ?? 0);
  const isPaid = method === "cash" || method === "upi";
  const now = new Date().toISOString();
  const rowBusinessId = appointment.business_id as string;

  const { data: existingPayment, error: existingError } = await supabase
    .from("payments")
    .select("id")
    .eq("appointment_id", appointmentId)
    .eq("business_id", rowBusinessId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    console.error("recordAppointmentPayment lookup:", existingError.message);
    return { ok: false, error: existingError.message };
  }

  const paymentPayload = {
    business_id: rowBusinessId,
    appointment_id: appointmentId,
    customer_name: customerName,
    amount: amount >= 0 ? amount : 0,
    method,
    status: isPaid ? ("paid" as const) : ("unpaid" as const),
    paid_at: isPaid ? now : null,
  };

  console.log("recordAppointmentPayment payload:", paymentPayload);

  let paymentError: { message: string } | null = null;

  if (existingPayment?.id) {
    const { error } = await supabase
      .from("payments")
      .update(paymentPayload)
      .eq("id", existingPayment.id)
      .eq("business_id", rowBusinessId);
    paymentError = error;
  } else {
    const { error } = await supabase.from("payments").insert(paymentPayload);
    paymentError = error;
  }

  if (paymentError) {
    console.error("recordAppointmentPayment insert:", paymentError.message);
    return { ok: false, error: paymentError.message };
  }

  if (isPaid) {
    await recordStaffCommissionForPayment({
      businessId: rowBusinessId,
      appointmentId,
      staffName: appointment.staff_name as string | null,
      serviceAmount: amount >= 0 ? amount : 0,
      earnedAt: now,
    });

    const customerId = appointment.customer_id as string | null;
    if (customerId) {
      await recordCustomerLoyaltyForPayment({
        businessId: rowBusinessId,
        appointmentId,
        customerId,
        amount: amount >= 0 ? amount : 0,
        paidAt: now,
      });
    }
  }

  const { error: updateError } = await supabase
    .from("appointments")
    .update({
      status: "completed",
      payment_status: isPaid ? "paid" : "unpaid",
    })
    .eq("id", appointmentId)
    .eq("business_id", rowBusinessId);

  if (updateError) {
    console.error("recordAppointmentPayment appointment:", updateError.message);
    return { ok: false, error: updateError.message };
  }

  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/money");
  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard");

  return { ok: true };
}
