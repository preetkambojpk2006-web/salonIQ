import {
  addCalendarDays,
  getDayBoundsIso,
  mondayOfWeekCalendarDay,
  SALON_TIMEZONE,
} from "@/lib/payments/date-utils";
import { createClient } from "@/lib/supabase/server";

export type Insight = {
  id: string;
  severity: "good" | "watch" | "action";
  title: string;
  detail: string;
  actionLabel?: string;
  actionType?: "whatsapp_offer" | "view_calendar" | "view_customers";
};

type AppointmentRow = {
  id: string;
  customer_id: string | null;
  service_name: string | null;
  staff_name: string | null;
  start_time: string;
  status: string;
  total_amount: number | string;
};

type PaymentRow = {
  amount: number | string;
  paid_at: string | null;
  appointment_id: string | null;
  status: string;
};

type CustomerRow = {
  id: string;
  name: string;
  visit_count: number;
  last_visit_at: string | null;
};

type CoachData = {
  appointments: AppointmentRow[];
  payments: PaymentRow[];
  customers: CustomerRow[];
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatRs(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatPct(value: number): string {
  const rounded = Math.round(value);
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
}

function sumAmounts(rows: { amount: number | string }[]): number {
  return rows.reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
}

function dayOfWeekInTimezone(iso: string): number {
  const short = new Intl.DateTimeFormat("en-US", {
    timeZone: SALON_TIMEZONE,
    weekday: "short",
  }).format(new Date(iso));
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[short] ?? 0;
}

function hourInTimezone(iso: string): number {
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone: SALON_TIMEZONE,
    hour: "numeric",
    hour12: false,
  }).format(new Date(iso));
  return Number.parseInt(hour, 10);
}

function formatHour12(hour: number): string {
  const period = hour < 12 ? "AM" : "PM";
  const h12 = hour % 12 || 12;
  return `${h12} ${period}`;
}

function isCountableAppointment(status: string): boolean {
  return status !== "cancelled";
}

function isActiveBooking(status: string): boolean {
  return status !== "cancelled" && status !== "no_show";
}

async function fetchCoachData(businessId: string): Promise<CoachData> {
  const supabase = createClient();
  const today = mondayOfWeekCalendarDay();
  const eightWeeksAgo = addCalendarDays(today, -56);
  const { startIso: appointmentsFrom } = getDayBoundsIso(eightWeeksAgo);

  const lastWeekMonday = addCalendarDays(mondayOfWeekCalendarDay(), -7);
  const { startIso: paymentsFrom } = getDayBoundsIso(lastWeekMonday);

  const [appointmentsRes, paymentsRes, customersRes] = await Promise.all([
    supabase
      .from("appointments")
      .select(
        "id, customer_id, service_name, staff_name, start_time, status, total_amount"
      )
      .eq("business_id", businessId)
      .gte("start_time", appointmentsFrom),
    supabase
      .from("payments")
      .select("amount, paid_at, appointment_id, status")
      .eq("business_id", businessId)
      .eq("status", "paid")
      .not("paid_at", "is", null)
      .gte("paid_at", paymentsFrom),
    supabase
      .from("customers")
      .select("id, name, visit_count, last_visit_at")
      .eq("business_id", businessId),
  ]);

  if (appointmentsRes.error) {
    console.error("fetchCoachData appointments:", appointmentsRes.error.message);
  }
  if (paymentsRes.error) {
    console.error("fetchCoachData payments:", paymentsRes.error.message);
  }
  if (customersRes.error) {
    console.error("fetchCoachData customers:", customersRes.error.message);
  }

  return {
    appointments: (appointmentsRes.data ?? []) as AppointmentRow[],
    payments: (paymentsRes.data ?? []) as PaymentRow[],
    customers: (customersRes.data ?? []) as CustomerRow[],
  };
}

function buildLowDataInsight(): Insight {
  return {
    id: "low-data",
    severity: "watch",
    title: "Insights abhi build ho rahe hain",
    detail:
      "Abhi data kam hai — kuch aur bookings ke baad better insights milenge. Calendar se bookings add karte jayein.",
    actionLabel: "Calendar kholo",
    actionType: "view_calendar",
  };
}

function buildRevenueTrendInsight(payments: PaymentRow[]): Insight | null {
  const thisMonday = mondayOfWeekCalendarDay();
  const lastMonday = addCalendarDays(thisMonday, -7);
  const thisWeekStart = getDayBoundsIso(thisMonday).startIso;
  const lastWeekStart = getDayBoundsIso(lastMonday).startIso;

  const thisWeek = payments.filter((p) => p.paid_at && p.paid_at >= thisWeekStart);
  const lastWeek = payments.filter(
    (p) =>
      p.paid_at &&
      p.paid_at >= lastWeekStart &&
      p.paid_at < thisWeekStart
  );

  const thisWeekTotal = sumAmounts(thisWeek);
  const lastWeekTotal = sumAmounts(lastWeek);

  if (thisWeekTotal === 0 && lastWeekTotal === 0) {
    return null;
  }

  let trendPct = 0;
  if (lastWeekTotal > 0) {
    trendPct = ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100;
  } else if (thisWeekTotal > 0) {
    trendPct = 100;
  }

  const severity: Insight["severity"] =
    trendPct >= 0 ? "good" : "watch";

  return {
    id: "revenue-trend",
    severity,
    title:
      trendPct >= 0
        ? "Is hafte revenue badh rahi hai"
        : "Is hafte revenue pichle hafte se kam hai",
    detail: `Is hafte (Mon se aaj) ${formatRs(thisWeekTotal)} collect hua — pichle hafte ${formatRs(lastWeekTotal)} tha (${formatPct(trendPct)}).`,
  };
}

function buildSlowSlotInsight(appointments: AppointmentRow[]): Insight | null {
  const fourWeeksAgo = addCalendarDays(mondayOfWeekCalendarDay(), -28);
  const { startIso } = getDayBoundsIso(fourWeeksAgo);

  const recent = appointments.filter(
    (a) => isActiveBooking(a.status) && a.start_time >= startIso
  );

  if (recent.length < 3) {
    return null;
  }

  const slotCounts = new Map<string, number>();

  for (const appointment of recent) {
    const dow = dayOfWeekInTimezone(appointment.start_time);
    const hour = hourInTimezone(appointment.start_time);
    const key = `${dow}-${hour}`;
    slotCounts.set(key, (slotCounts.get(key) ?? 0) + 1);
  }

  // Common salon hours 10–19 IST; find emptiest among these
  let slowestKey: string | null = null;
  let slowestCount = Number.POSITIVE_INFINITY;

  for (let dow = 1; dow <= 6; dow++) {
    for (let hour = 10; hour <= 19; hour++) {
      const key = `${dow}-${hour}`;
      const count = slotCounts.get(key) ?? 0;
      if (count < slowestCount) {
        slowestCount = count;
        slowestKey = key;
      }
    }
  }

  if (!slowestKey) {
    return null;
  }

  const [dowStr, hourStr] = slowestKey.split("-");
  const dow = Number.parseInt(dowStr, 10);
  const hour = Number.parseInt(hourStr, 10);

  return {
    id: "slow-slot",
    severity: "action",
    title: "Khaali slot — yahan bookings badha sakte ho",
    detail: `Pichle 4 hafton mein ${DAY_LABELS[dow]} ${formatHour12(hour)} par sirf ${slowestCount} booking${slowestCount === 1 ? "" : "s"} hui. Is slot ke liye offer ya reminder bhejna worth hai.`,
    actionLabel: "Calendar dekho",
    actionType: "view_calendar",
  };
}

function buildTopServiceByBookingsInsight(
  appointments: AppointmentRow[]
): Insight | null {
  const counts = new Map<string, number>();

  for (const appointment of appointments) {
    if (!isActiveBooking(appointment.status)) continue;
    const name = appointment.service_name?.trim() || "Other";
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  if (counts.size === 0) {
    return null;
  }

  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  const [topService, topCount] = sorted[0];

  return {
    id: "top-service-bookings",
    severity: "good",
    title: `${topService} sabse zyada book ho raha hai`,
    detail: `Pichle 8 hafton mein ${topCount} booking${topCount === 1 ? "" : "s"} — yeh aapki demand leader service hai.`,
  };
}

function buildTopServiceByRevenueInsight(
  appointments: AppointmentRow[],
  payments: PaymentRow[]
): Insight | null {
  const serviceByAppointment = new Map<string, string>();
  for (const appointment of appointments) {
    serviceByAppointment.set(
      appointment.id,
      appointment.service_name?.trim() || "Other"
    );
  }

  const revenueByService = new Map<string, number>();

  for (const payment of payments) {
    if (!payment.appointment_id) continue;
    const service =
      serviceByAppointment.get(payment.appointment_id) ?? "Other";
    revenueByService.set(
      service,
      (revenueByService.get(service) ?? 0) + Number(payment.amount ?? 0)
    );
  }

  if (revenueByService.size === 0) {
    return null;
  }

  const sorted = Array.from(revenueByService.entries()).sort(
    (a, b) => b[1] - a[1]
  );
  const [topService, topRevenue] = sorted[0];

  return {
    id: "top-service-revenue",
    severity: "good",
    title: `${topService} se sabse zyada revenue`,
    detail: `Pichle 2 hafton mein ${topService} ne ${formatRs(topRevenue)} earn kiya — is service ko promote karna smart move hai.`,
  };
}

function buildTopStaffByRevenueInsight(
  appointments: AppointmentRow[],
  payments: PaymentRow[]
): Insight | null {
  const staffByAppointment = new Map<string, string>();
  for (const appointment of appointments) {
    staffByAppointment.set(
      appointment.id,
      appointment.staff_name?.trim() || "Unassigned"
    );
  }

  const revenueByStaff = new Map<string, number>();

  for (const payment of payments) {
    if (!payment.appointment_id) continue;
    const staff =
      staffByAppointment.get(payment.appointment_id) ?? "Unassigned";
    revenueByStaff.set(
      staff,
      (revenueByStaff.get(staff) ?? 0) + Number(payment.amount ?? 0)
    );
  }

  if (revenueByStaff.size === 0) {
    return null;
  }

  const sorted = Array.from(revenueByStaff.entries()).sort((a, b) => b[1] - a[1]);
  const [topStaff, topRevenue] = sorted[0];

  if (topStaff === "Unassigned") {
    return null;
  }

  return {
    id: "top-staff-revenue",
    severity: "good",
    title: `${topStaff} top performer hain`,
    detail: `Pichle 2 hafton mein ${topStaff} ne ${formatRs(topRevenue)} revenue generate kiya — unke busy slots protect karein.`,
  };
}

function buildInactiveCustomersInsight(
  customers: CustomerRow[],
  appointments: AppointmentRow[]
): Insight | null {
  if (customers.length === 0) {
    return null;
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoffIso = thirtyDaysAgo.toISOString();

  const lastAppointmentByCustomer = new Map<string, string>();
  for (const appointment of appointments) {
    if (!appointment.customer_id || !isCountableAppointment(appointment.status)) {
      continue;
    }
    const existing = lastAppointmentByCustomer.get(appointment.customer_id);
    if (!existing || appointment.start_time > existing) {
      lastAppointmentByCustomer.set(
        appointment.customer_id,
        appointment.start_time
      );
    }
  }

  let inactiveCount = 0;

  for (const customer of customers) {
    const lastVisit =
      customer.last_visit_at ??
      lastAppointmentByCustomer.get(customer.id) ??
      null;

    if (!lastVisit || lastVisit < cutoffIso) {
      inactiveCount += 1;
    }
  }

  if (inactiveCount === 0) {
    return null;
  }

  return {
    id: "inactive-customers",
    severity: "action",
    title: `${inactiveCount} customer${inactiveCount === 1 ? "" : "s"} 30+ din se inactive`,
    detail: `In customers ko revisit offer ya reminder bhejna revenue recover kar sakta hai — WhatsApp se ek gentle message try karein.`,
    actionLabel: "WhatsApp offer bhejo",
    actionType: "whatsapp_offer",
  };
}

function buildRepeatAndNoShowInsight(
  customers: CustomerRow[],
  appointments: AppointmentRow[]
): Insight | null {
  const countable = appointments.filter((a) => isCountableAppointment(a.status));

  if (countable.length === 0 && customers.length === 0) {
    return null;
  }

  const totalCustomers = customers.length;
  const repeatCustomers = customers.filter(
    (c) => Number(c.visit_count ?? 0) > 1
  ).length;
  const repeatRate =
    totalCustomers > 0
      ? Math.round((repeatCustomers / totalCustomers) * 100)
      : 0;

  const noShows = countable.filter((a) => a.status === "no_show").length;
  const noShowRate =
    countable.length > 0
      ? Math.round((noShows / countable.length) * 100)
      : 0;

  const repeatGood = repeatRate >= 40;
  const noShowWatch = noShowRate >= 10;

  let severity: Insight["severity"] = "good";
  if (noShowWatch || (!repeatGood && totalCustomers >= 3)) {
    severity = "watch";
  }
  if (repeatRate >= 50 && noShowRate < 10) {
    severity = "good";
  }

  const parts: string[] = [];
  if (totalCustomers > 0) {
    parts.push(
      `Repeat customer rate ${repeatRate}% hai (${repeatCustomers} of ${totalCustomers})`
    );
  }
  if (countable.length > 0) {
    parts.push(
      `no-show rate ${noShowRate}% hai (${noShows} of ${countable.length} bookings)`
    );
  }

  return {
    id: "repeat-no-show",
    severity,
    title:
      noShowWatch
        ? "No-show rate dhyaan dena chahiye"
        : repeatGood
          ? "Customer loyalty healthy lag rahi hai"
          : "Retention improve karne ka mauka hai",
    detail: `${parts.join(" — ")}. ${noShowWatch ? "Confirm karne ke baad 24hr reminder bhejna help karta hai." : "Regular customers ko priority slots do."}`,
    actionLabel: noShowWatch ? "Calendar dekho" : undefined,
    actionType: noShowWatch ? "view_calendar" : undefined,
  };
}

export async function getCoachInsights(businessId: string): Promise<Insight[]> {
  const data = await fetchCoachData(businessId);

  const activeAppointments = data.appointments.filter((a) =>
    isCountableAppointment(a.status)
  );
  const paidPayments = data.payments.filter((p) => p.status === "paid");

  if (activeAppointments.length < 3 || paidPayments.length < 1) {
    return [buildLowDataInsight()];
  }

  const insights: Insight[] = [];

  const builders = [
    () => buildRevenueTrendInsight(paidPayments),
    () => buildSlowSlotInsight(data.appointments),
    () => buildTopServiceByBookingsInsight(data.appointments),
    () => buildTopServiceByRevenueInsight(data.appointments, paidPayments),
    () => buildTopStaffByRevenueInsight(data.appointments, paidPayments),
    () => buildInactiveCustomersInsight(data.customers, data.appointments),
    () => buildRepeatAndNoShowInsight(data.customers, data.appointments),
  ];

  for (const build of builders) {
    const insight = build();
    if (insight) {
      insights.push(insight);
    }
  }

  if (insights.length === 0) {
    return [buildLowDataInsight()];
  }

  return insights;
}
