"use server";

import { getOwnerBusinessId } from "@/lib/customers/queries";
import type { PaymentMethod } from "@/lib/payments/types";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const VALID_METHODS: PaymentMethod[] = ["cash", "upi", "pending"];

export async function recordAppointmentPayment(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const businessId = await getOwnerBusinessId();
  if (!businessId) {
    redirect("/dashboard/calendar?error=Set up your salon first");
  }

  const appointmentId = (formData.get("appointment_id") as string)?.trim();
  const method = (formData.get("method") as string)?.trim() as PaymentMethod;

  if (!appointmentId || !VALID_METHODS.includes(method)) {
    redirect("/dashboard/calendar?error=Could not save payment");
  }

  const { data: appointment, error: fetchError } = await supabase
    .from("appointments")
    .select(
      "id, business_id, total_amount, customer_id, customers ( name )"
    )
    .eq("id", appointmentId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (fetchError || !appointment) {
    redirect("/dashboard/calendar?error=Booking not found");
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

  const { data: existingPayment } = await supabase
    .from("payments")
    .select("id")
    .eq("appointment_id", appointmentId)
    .eq("business_id", rowBusinessId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const paymentPayload = {
    business_id: rowBusinessId,
    appointment_id: appointmentId,
    customer_name: customerName,
    amount: amount >= 0 ? amount : 0,
    method,
    status: isPaid ? "paid" : "unpaid",
    paid_at: isPaid ? now : null,
  };

  const paymentError = existingPayment
    ? (
        await supabase
          .from("payments")
          .update(paymentPayload)
          .eq("id", existingPayment.id)
          .eq("business_id", rowBusinessId)
      ).error
    : (await supabase.from("payments").insert(paymentPayload)).error;

  if (paymentError) {
    console.error("recordAppointmentPayment:", paymentError.message);
    redirect(
      `/dashboard/calendar?error=${encodeURIComponent(paymentError.message)}`
    );
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
    redirect(
      `/dashboard/calendar?error=${encodeURIComponent(updateError.message)}`
    );
  }

  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/money");
  revalidatePath("/dashboard");
  redirect("/dashboard/calendar?paid=1");
}
