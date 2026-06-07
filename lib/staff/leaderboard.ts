import {
  SALON_TIMEZONE,
  todayCalendarDay,
} from "@/lib/payments/date-utils";
import { createClient } from "@/lib/supabase/server";

export type StaffLeaderboardEntry = {
  staffName: string;
  totalRevenue: number;
  appointmentCount: number;
  rank: number;
};

type PaymentRow = {
  amount: number | string;
  appointment_id: string | null;
};

type AppointmentRow = {
  id: string;
  staff_name: string | null;
};

function getCurrentMonthBounds(timeZone = SALON_TIMEZONE): {
  startIso: string;
  endIsoExclusive: string;
} {
  const today = todayCalendarDay(timeZone);
  const [yearStr, monthStr] = today.split("-");
  const year = Number.parseInt(yearStr, 10);
  const month = Number.parseInt(monthStr, 10);

  const firstDay = `${yearStr}-${monthStr}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const firstDayNext = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

  return {
    startIso: new Date(`${firstDay}T00:00:00+05:30`).toISOString(),
    endIsoExclusive: new Date(`${firstDayNext}T00:00:00+05:30`).toISOString(),
  };
}

export async function getStaffLeaderboard(
  businessId: string
): Promise<StaffLeaderboardEntry[]> {
  const supabase = createClient();
  const { startIso, endIsoExclusive } = getCurrentMonthBounds();

  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select("amount, appointment_id")
    .eq("business_id", businessId)
    .eq("status", "paid")
    .not("paid_at", "is", null)
    .gte("paid_at", startIso)
    .lt("paid_at", endIsoExclusive)
    .not("appointment_id", "is", null);

  if (paymentsError) {
    console.error("getStaffLeaderboard payments:", paymentsError.message);
    return [];
  }

  const paidPayments = (payments ?? []) as PaymentRow[];
  if (paidPayments.length === 0) {
    return [];
  }

  const appointmentIds = Array.from(
    new Set(
      paidPayments
        .map((payment) => payment.appointment_id)
        .filter((id): id is string => Boolean(id))
    )
  );

  if (appointmentIds.length === 0) {
    return [];
  }

  const { data: appointments, error: appointmentsError } = await supabase
    .from("appointments")
    .select("id, staff_name")
    .eq("business_id", businessId)
    .in("id", appointmentIds);

  if (appointmentsError) {
    console.error("getStaffLeaderboard appointments:", appointmentsError.message);
    return [];
  }

  const staffByAppointment = new Map<string, string>();
  for (const appointment of (appointments ?? []) as AppointmentRow[]) {
    staffByAppointment.set(
      appointment.id,
      appointment.staff_name?.trim() || "Unassigned"
    );
  }

  const revenueByStaff = new Map<string, number>();
  const appointmentsByStaff = new Map<string, Set<string>>();

  for (const payment of paidPayments) {
    if (!payment.appointment_id) continue;

    const staffName =
      staffByAppointment.get(payment.appointment_id) ?? "Unassigned";
    if (staffName === "Unassigned") continue;

    const amount = Number(payment.amount ?? 0);
    revenueByStaff.set(
      staffName,
      (revenueByStaff.get(staffName) ?? 0) + amount
    );

    const appointmentSet =
      appointmentsByStaff.get(staffName) ?? new Set<string>();
    appointmentSet.add(payment.appointment_id);
    appointmentsByStaff.set(staffName, appointmentSet);
  }

  if (revenueByStaff.size === 0) {
    return [];
  }

  const sorted = Array.from(revenueByStaff.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return sorted.map(([staffName, totalRevenue], index) => ({
    staffName,
    totalRevenue,
    appointmentCount: appointmentsByStaff.get(staffName)?.size ?? 0,
    rank: index + 1,
  }));
}
