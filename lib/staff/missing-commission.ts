import { createClient } from "@/lib/supabase/server";
import type { MissingCommissionAppointment } from "@/lib/staff/types";

/** Paid, completed bookings with no staff_earnings row (commission never recorded). */
export async function getPaidAppointmentsMissingCommission(
  businessId: string,
  limit = 20
): Promise<MissingCommissionAppointment[]> {
  const supabase = createClient();

  const { data: appointments, error } = await supabase
    .from("appointments")
    .select("id, staff_name, service_name, total_amount, start_time")
    .eq("business_id", businessId)
    .eq("payment_status", "paid")
    .eq("status", "completed")
    .order("start_time", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getPaidAppointmentsMissingCommission:", error.message);
    return [];
  }

  if (!appointments?.length) {
    return [];
  }

  const appointmentIds = appointments.map((row) => row.id);

  const { data: earnings, error: earningsError } = await supabase
    .from("staff_earnings")
    .select("appointment_id")
    .eq("business_id", businessId)
    .in("appointment_id", appointmentIds);

  if (earningsError) {
    console.error(
      "getPaidAppointmentsMissingCommission earnings:",
      earningsError.message
    );
    return [];
  }

  const recordedIds = new Set(
    (earnings ?? [])
      .map((row) => row.appointment_id)
      .filter((id): id is string => Boolean(id))
  );

  return appointments
    .filter((row) => !recordedIds.has(row.id))
    .map((row) => ({
      appointmentId: row.id,
      staffName: row.staff_name?.trim() || "Unassigned",
      serviceName: row.service_name?.trim() || null,
      totalAmount: Number(row.total_amount ?? 0),
      startTime: row.start_time,
    }));
}
