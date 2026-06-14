"use server";

import {
  getUserMembership,
  isOwnerOrAdmin,
} from "@/lib/auth/membership";
import { computeCascadePreview } from "@/lib/appointments/cascade";
import type { CascadePreview } from "@/lib/appointments/cascade";
import {
  getAppointmentById,
  listAppointments,
  listStaffDayAppointments,
} from "@/lib/appointments/queries";
import { incrementCustomerNoShowCount } from "@/lib/customers/reliability";
import { getOwnerBusinessId } from "@/lib/customers/queries";
import type { AppointmentStatus } from "@/lib/appointments/types";
import { getOwnerBranches } from "@/lib/onboarding/queries";
import { calendarDayInTimezone } from "@/lib/payments/date-utils";
import {
  recordAppointmentPayment,
  type RecordPaymentResult,
} from "@/lib/payments/actions";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type PreviewTimeChangeResult =
  | { ok: true; preview: CascadePreview }
  | { ok: false; error: string };

export type ApplyTimeCascadeResult =
  | { ok: true; success: true; shifted_count: number; preview: CascadePreview }
  | { ok: false; error: string };

async function requireOwnerOrAdmin(): Promise<
  { ok: true; businessId: string } | { ok: false; error: string }
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const membership = await getUserMembership();
  if (!membership?.businessId || !isOwnerOrAdmin(membership.appRole)) {
    return {
      ok: false,
      error: "Sirf owner ya admin appointment time edit kar sakte hain.",
    };
  }

  return { ok: true, businessId: membership.businessId };
}

function parseIsoDate(value: string): Date | null {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

async function buildTimeChangePreview(
  appointmentId: string,
  newStartISO: string,
  newEndISO: string
): Promise<PreviewTimeChangeResult> {
  const access = await requireOwnerOrAdmin();
  if (!access.ok) return access;

  const appointment = await getAppointmentById(appointmentId);
  if (!appointment) {
    return { ok: false, error: "Appointment nahi mili." };
  }

  if (appointment.business_id !== access.businessId) {
    return { ok: false, error: "Appointment access nahi hai." };
  }

  if (appointment.status !== "pending" && appointment.status !== "confirmed") {
    return {
      ok: false,
      error: "Completed/cancelled appointments ka time edit nahi ho sakta.",
    };
  }

  const newStart = parseIsoDate(newStartISO);
  const newEnd = parseIsoDate(newEndISO);

  if (!newStart || !newEnd) {
    return { ok: false, error: "Valid start aur end time daalein." };
  }

  if (newEnd.getTime() <= newStart.getTime()) {
    return { ok: false, error: "End time start time se baad hona chahiye." };
  }

  const originalDay = calendarDayInTimezone(appointment.start_time);
  const newStartDay = calendarDayInTimezone(newStart);
  const newEndDay = calendarDayInTimezone(newEnd);

  if (newStartDay !== originalDay || newEndDay !== originalDay) {
    return {
      ok: false,
      error: "Abhi sirf usi din ke andar time edit ho sakta hai.",
    };
  }

  const dayAppointments = await listStaffDayAppointments(
    access.businessId,
    appointment.staff_name ?? "",
    originalDay
  );

  const preview = computeCascadePreview(
    appointment,
    dayAppointments,
    newStart,
    newEnd
  );

  return { ok: true, preview };
}

export async function previewAppointmentTimeChange(
  appointmentId: string,
  newStartISO: string,
  newEndISO: string
): Promise<PreviewTimeChangeResult> {
  return buildTimeChangePreview(appointmentId, newStartISO, newEndISO);
}

export async function applyAppointmentTimeCascade(
  appointmentId: string,
  newStartISO: string,
  newEndISO: string
): Promise<ApplyTimeCascadeResult> {
  const previewResult = await buildTimeChangePreview(
    appointmentId,
    newStartISO,
    newEndISO
  );

  if (!previewResult.ok) {
    return previewResult;
  }

  if (previewResult.preview.has_hard_error) {
    return {
      ok: false,
      error:
        previewResult.preview.warnings[0] ??
        "Overlap ki wajah se time change apply nahi ho sakta.",
    };
  }

  const supabase = createClient();
  const { preview } = previewResult;

  const { error: anchorError } = await supabase
    .from("appointments")
    .update({
      start_time: preview.anchor.new_start,
      end_time: preview.anchor.new_end,
    })
    .eq("id", preview.anchor.id);

  if (anchorError) {
    console.error("applyAppointmentTimeCascade anchor:", anchorError.message);
    return { ok: false, error: anchorError.message };
  }

  for (const row of preview.shifted) {
    const { error } = await supabase
      .from("appointments")
      .update({
        start_time: row.new_start,
        end_time: row.new_end,
      })
      .eq("id", row.id);

    if (error) {
      console.error("applyAppointmentTimeCascade shifted:", error.message);
      return { ok: false, error: error.message };
    }
  }

  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard");

  return {
    ok: true,
    success: true,
    shifted_count: preview.shifted.length,
    preview,
  };
}

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
  status: AppointmentStatus
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", appointmentId)
    .select("id")
    .maybeSingle();

  if (error) {
    return error;
  }

  if (!data) {
    return new Error("Could not update booking");
  }

  return null;
}

export async function confirmAppointment(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const appointmentId = (formData.get("appointment_id") as string)?.trim();
  if (!appointmentId) redirect("/dashboard/calendar?error=Could not confirm");

  const error = await setAppointmentStatus(appointmentId, "confirmed");
  if (error) {
    redirect(`/dashboard/calendar?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/money");
  redirect("/dashboard/calendar");
}

export async function rejectAppointment(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const appointmentId = (formData.get("appointment_id") as string)?.trim();
  if (!appointmentId) redirect("/dashboard/calendar?error=Could not reject");

  const error = await setAppointmentStatus(appointmentId, "cancelled");
  if (error) {
    redirect(`/dashboard/calendar?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard");
  redirect("/dashboard/calendar");
}

export async function markNoShow(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const appointmentId = (formData.get("appointment_id") as string)?.trim();
  if (!appointmentId) redirect("/dashboard/calendar?error=Could not update");

  const { data: appointment } = await supabase
    .from("appointments")
    .select("status, customer_id, business_id")
    .eq("id", appointmentId)
    .maybeSingle();

  if (!appointment) {
    redirect("/dashboard/calendar?error=Could not update");
  }

  if (appointment.status !== "no_show") {
    const error = await setAppointmentStatus(appointmentId, "no_show");
    if (error) {
      redirect(`/dashboard/calendar?error=${encodeURIComponent(error.message)}`);
    }

    if (appointment.customer_id) {
      await incrementCustomerNoShowCount(
        appointment.customer_id,
        appointment.business_id
      );
    }
  }

  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/money");
  revalidatePath("/dashboard/customers");
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

  const { data: appointment } = await supabase
    .from("appointments")
    .select("status, customer_id, business_id")
    .eq("id", appointmentId)
    .maybeSingle();

  if (!appointment) {
    redirect("/dashboard/calendar?error=Could not update booking");
  }

  const error = await setAppointmentStatus(appointmentId, status);

  if (error) {
    redirect(
      `/dashboard/calendar?error=${encodeURIComponent(error.message)}`
    );
  }

  if (
    status === "no_show" &&
    appointment.status !== "no_show" &&
    appointment.customer_id
  ) {
    await incrementCustomerNoShowCount(
      appointment.customer_id,
      appointment.business_id
    );
  }

  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/customers");
  redirect("/dashboard/calendar");
}

/** Complete appointment + record payment (delegates to payments action). */
export async function completeAppointmentPayment(
  formData: FormData
): Promise<RecordPaymentResult> {
  return recordAppointmentPayment(formData);
}
