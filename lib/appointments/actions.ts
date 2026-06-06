"use server";

import { getOwnerBusinessId } from "@/lib/customers/queries";
import type { AppointmentStatus } from "@/lib/appointments/types";
import { listAppointments } from "@/lib/appointments/queries";
import { getOwnerBranches } from "@/lib/onboarding/queries";
import {
  recordAppointmentPayment,
  type RecordPaymentResult,
} from "@/lib/payments/actions";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getAppointments() {
  return listAppointments();
}

async function resolveCustomerId(
  businessId: string,
  customerName: string
): Promise<string | null> {
  const supabase = createClient();
  const trimmed = customerName.trim();
  if (!trimmed) return null;

  const { data: existing } = await supabase
    .from("customers")
    .select("id")
    .eq("business_id", businessId)
    .ilike("name", trimmed)
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    return existing.id;
  }

  const { data: created, error } = await supabase
    .from("customers")
    .insert({ business_id: businessId, name: trimmed })
    .select("id")
    .single();

  if (error) {
    console.error("resolveCustomerId:", error.message);
    return null;
  }

  return created.id;
}

function parseStartTime(date: string, time: string): string | null {
  if (!date || !time) return null;
  const iso = `${date}T${time}:00`;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function defaultEndTime(startIso: string): string {
  const start = new Date(startIso);
  start.setHours(start.getHours() + 1);
  return start.toISOString();
}

export type CreateAppointmentResult =
  | { ok: true; appointmentId: string }
  | { ok: false; error: string };

export async function createAppointment(
  formData: FormData
): Promise<CreateAppointmentResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const businessId = await getOwnerBusinessId();
  if (!businessId) {
    return { ok: false, error: "Pehle salon setup karein." };
  }

  const customerName = (formData.get("customer_name") as string)?.trim();
  const serviceName = (formData.get("service_name") as string)?.trim() || null;
  const staffName = (formData.get("staff_name") as string)?.trim() || null;
  const date = (formData.get("date") as string)?.trim();
  const time = (formData.get("time") as string)?.trim();
  const amountRaw = (formData.get("amount") as string)?.trim();
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!customerName) {
    return { ok: false, error: "Customer ka naam daalein." };
  }

  if (!serviceName) {
    return { ok: false, error: "Service ka naam daalein." };
  }

  const startTime = parseStartTime(date, time);
  if (!startTime) {
    return { ok: false, error: "Sahi date aur time choose karein." };
  }

  const totalAmount = amountRaw ? Number.parseFloat(amountRaw) : 0;
  if (amountRaw && Number.isNaN(totalAmount)) {
    return { ok: false, error: "Sahi amount daalein." };
  }

  const customerId = await resolveCustomerId(businessId, customerName);
  const branches = await getOwnerBranches(businessId);
  const branchId = branches[0]?.id ?? null;

  const { data: created, error } = await supabase
    .from("appointments")
    .insert({
      business_id: businessId,
      branch_id: branchId,
      customer_id: customerId,
      staff_name: staffName,
      service_name: serviceName,
      start_time: startTime,
      end_time: defaultEndTime(startTime),
      status: "pending",
      notes,
      total_amount: totalAmount >= 0 ? totalAmount : 0,
      payment_status: "unpaid",
      source: "manual",
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/calendar");
  return { ok: true, appointmentId: created.id };
}

const VALID_STATUSES: AppointmentStatus[] = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
];

async function setAppointmentStatus(
  appointmentId: string,
  businessId: string,
  status: AppointmentStatus
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", appointmentId)
    .eq("business_id", businessId);

  return error;
}

export async function confirmAppointment(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const businessId = await getOwnerBusinessId();
  if (!businessId) redirect("/dashboard/calendar?error=Set up your salon first");

  const appointmentId = (formData.get("appointment_id") as string)?.trim();
  if (!appointmentId) redirect("/dashboard/calendar?error=Could not confirm");

  const error = await setAppointmentStatus(
    appointmentId,
    businessId,
    "confirmed"
  );
  if (error) {
    redirect(`/dashboard/calendar?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/money");
  redirect("/dashboard/calendar");
}

export async function markNoShow(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const businessId = await getOwnerBusinessId();
  if (!businessId) redirect("/dashboard/calendar?error=Set up your salon first");

  const appointmentId = (formData.get("appointment_id") as string)?.trim();
  if (!appointmentId) redirect("/dashboard/calendar?error=Could not update");

  const error = await setAppointmentStatus(appointmentId, businessId, "no_show");
  if (error) {
    redirect(`/dashboard/calendar?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/money");
  redirect("/dashboard/calendar");
}

export async function updateAppointmentStatus(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const businessId = await getOwnerBusinessId();
  if (!businessId) {
    redirect("/dashboard/calendar?error=Set up your salon first");
  }

  const appointmentId = (formData.get("appointment_id") as string)?.trim();
  const status = (formData.get("status") as string)?.trim() as AppointmentStatus;

  if (!appointmentId || !VALID_STATUSES.includes(status)) {
    redirect("/dashboard/calendar?error=Could not update booking");
  }

  const error = await setAppointmentStatus(appointmentId, businessId, status);

  if (error) {
    redirect(
      `/dashboard/calendar?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/dashboard/calendar");
  redirect("/dashboard/calendar");
}

/** Complete appointment + record payment (delegates to payments action). */
export async function completeAppointmentPayment(
  formData: FormData
): Promise<RecordPaymentResult> {
  return recordAppointmentPayment(formData);
}
