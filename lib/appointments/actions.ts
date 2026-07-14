"use server";

import {
  getUserMembership,
  isOwnerOrAdmin,
} from "@/lib/auth/membership";
import { computeCascadePreview } from "@/lib/appointments/cascade";
import type { CascadePreview } from "@/lib/appointments/cascade";
import { hasAppointmentOverlap } from "@/lib/appointments/overlap";
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
  | { ok: false; error: string; requires_confirmation?: boolean };

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
  newEndISO: string,
  force = false
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

  if (previewResult.preview.has_clash_warning && !force) {
    return {
      ok: false,
      error: "Cascade clash requires owner confirmation.",
      requires_confirmation: true,
    };
  }

  const access = await requireOwnerOrAdmin();
  if (!access.ok) return access;

  const supabase = createClient();
  const { preview } = previewResult;

  // Atomic RPC: anchor + all shifted rows update in one DB transaction —
  // a mid-flight failure rolls back the whole cascade.
  const { error: cascadeError } = await supabase.rpc(
    "apply_appointment_cascade_atomic",
    {
      p_business_id: access.businessId,
      p_anchor_id: preview.anchor.id,
      p_anchor_start: preview.anchor.new_start,
      p_anchor_end: preview.anchor.new_end,
      p_shifted: preview.shifted.map((row) => ({
        id: row.id,
        new_start: row.new_start,
        new_end: row.new_end,
      })),
    }
  );

  if (cascadeError) {
    console.error("applyAppointmentTimeCascade rpc:", cascadeError.message);
    return { ok: false, error: cascadeError.message };
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
  const parsed = new Date(`${date}T${time}:00+05:30`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function defaultEndTime(startIso: string): string {
  return new Date(new Date(startIso).getTime() + 3_600_000).toISOString();
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

  const parsedAmount = amountRaw ? Number.parseFloat(amountRaw) : null;
  if (amountRaw && (parsedAmount === null || Number.isNaN(parsedAmount))) {
    return { ok: false, error: "Sahi amount daalein." };
  }
  if (parsedAmount !== null && parsedAmount < 0) {
    return { ok: false, error: "Amount 0 se kam nahi ho sakta." };
  }

  const needsServicePrice =
    parsedAmount === null || parsedAmount === 0;

  const endTime = defaultEndTime(startTime);

  // These lookups are independent — run them in parallel to cut latency.
  const [overlap, customerId, branches, serviceRow] = await Promise.all([
    hasAppointmentOverlap({
      businessId,
      staffName,
      startTime,
      endTime,
    }),
    resolveCustomerId(businessId, customerName),
    getOwnerBranches(businessId),
    needsServicePrice
      ? supabase
          .from("services")
          .select("price")
          .eq("business_id", businessId)
          .eq("is_active", true)
          .ilike("name", serviceName)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (overlap) {
    return {
      ok: false,
      error: "Is staff ke liye yeh time slot pehle se booked hai.",
    };
  }

  let totalAmount = parsedAmount ?? 0;
  if (needsServicePrice && serviceRow.data?.price != null) {
    const servicePrice = Number(serviceRow.data.price);
    if (Number.isFinite(servicePrice) && servicePrice > 0) {
      totalAmount = servicePrice;
    }
  }

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
      end_time: endTime,
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
  revalidatePath("/dashboard");
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

  const businessId = await getOwnerBusinessId();
  const { data: appointment } = businessId
    ? await supabase
        .from("appointments")
        .select("id, business_id, staff_name, start_time, end_time, status")
        .eq("id", appointmentId)
        .eq("business_id", businessId)
        .maybeSingle()
    : { data: null };

  if (!appointment || appointment.status !== "pending") {
    redirect("/dashboard/calendar?error=Could not confirm");
  }

  const confirmEnd =
    appointment.end_time ??
    new Date(new Date(appointment.start_time).getTime() + 3_600_000).toISOString();

  const overlap = await hasAppointmentOverlap({
    businessId: appointment.business_id,
    staffName: appointment.staff_name,
    startTime: appointment.start_time,
    endTime: confirmEnd,
    excludeAppointmentId: appointment.id,
  });
  if (overlap) {
    redirect(
      "/dashboard/calendar?error=" +
        encodeURIComponent("Slot overlap — confirm nahi ho sakta.")
    );
  }

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

  const businessId = await getOwnerBusinessId();
  const { data: appointment } = businessId
    ? await supabase
        .from("appointments")
        .select("id, business_id, status")
        .eq("id", appointmentId)
        .eq("business_id", businessId)
        .maybeSingle()
    : { data: null };

  if (!appointment) {
    redirect("/dashboard/calendar?error=Could not reject");
  }

  if (appointment.status !== "pending" && appointment.status !== "confirmed") {
    redirect(
      "/dashboard/calendar?error=" +
        encodeURIComponent("Sirf pending ya confirmed booking reject ho sakti hai.")
    );
  }

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

  const businessId = await getOwnerBusinessId();
  const { data: appointment } = businessId
    ? await supabase
        .from("appointments")
        .select("id, status, customer_id, business_id")
        .eq("id", appointmentId)
        .eq("business_id", businessId)
        .maybeSingle()
    : { data: null };

  if (!appointment) {
    redirect("/dashboard/calendar?error=Could not update");
  }

  if (appointment.status !== "pending" && appointment.status !== "confirmed") {
    redirect(
      "/dashboard/calendar?error=" +
        encodeURIComponent(
          "Sirf pending ya confirmed booking no-show mark ho sakti hai."
        )
    );
  }

  const error = await setAppointmentStatus(appointmentId, "no_show");
  if (error) {
    redirect(`/dashboard/calendar?error=${encodeURIComponent(error.message)}`);
  }

  if (appointment.customer_id) {
    void incrementCustomerNoShowCount(
      appointment.customer_id,
      appointment.business_id
    );
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
    void incrementCustomerNoShowCount(
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
