import { todayCalendarDay } from "@/lib/payments/date-utils";
import { listStaffMembers } from "@/lib/salon/queries";
import { normalizeStaffName, roundMoney } from "@/lib/staff/advances";
import {
  createFineForLateAttendance,
  getOutstandingFines as fetchOutstandingFines,
  voidOutstandingFinesForAttendance,
} from "@/lib/staff/fines";
import { createClient } from "@/lib/supabase/server";
import type {
  ActiveStaffMember,
  AttendanceStatus,
  MarkAttendanceResult,
  MonthAttendanceData,
  MonthDayRecord,
  MonthStaffAttendanceSummary,
  StaffAttendanceRow,
  StaffFineRow,
  StaffMonthDetail,
} from "@/lib/attendance/types";

type AttendanceDbRow = {
  id: string;
  business_id: string;
  staff_id: string;
  staff_name: string;
  attendance_date: string;
  status: string;
  marked_at: string;
  notes: string | null;
};

function mapAttendanceRow(row: AttendanceDbRow): StaffAttendanceRow {
  const status = row.status;
  const validStatus: AttendanceStatus =
    status === "present" || status === "absent" || status === "late"
      ? status
      : "present";

  return {
    id: row.id,
    business_id: row.business_id,
    staff_id: row.staff_id,
    staff_name: row.staff_name,
    attendance_date: row.attendance_date,
    status: validStatus,
    marked_at: row.marked_at,
    notes: row.notes,
  };
}

function monthCalendarBounds(
  year: number,
  month: number
): { start: string; end: string } {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`;
  return { start, end };
}

export function listIstMonthDaysUpToToday(year: number, month: number): string[] {
  const today = todayCalendarDay();
  const [todayYear, todayMonth, todayDay] = today.split("-").map(Number);
  const lastDayOfMonth = new Date(year, month, 0).getDate();

  let endDay = lastDayOfMonth;
  if (year === todayYear && month === todayMonth) {
    endDay = todayDay;
  } else if (
    year > todayYear ||
    (year === todayYear && month > todayMonth)
  ) {
    return [];
  }

  const days: string[] = [];
  for (let day = 1; day <= endDay; day += 1) {
    days.push(
      `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    );
  }
  return days;
}

export function formatMonthDayLabels(date: string): {
  dateLabel: string;
  dayLabel: string;
} {
  const parsed = new Date(`${date}T12:00:00+05:30`);
  const dateLabel = parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  });
  const dayLabel = parsed.toLocaleDateString("en-IN", {
    weekday: "short",
    timeZone: "Asia/Kolkata",
  });
  return { dateLabel, dayLabel };
}

export async function getBusinessLateFineAmount(
  businessId: string
): Promise<number> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("businesses")
    .select("late_fine_amount")
    .eq("id", businessId)
    .maybeSingle();

  if (error) {
    console.error("getBusinessLateFineAmount:", error.message);
    return 100;
  }

  return roundMoney(Number(data?.late_fine_amount ?? 100));
}

export async function getActiveStaff(
  businessId: string
): Promise<ActiveStaffMember[]> {
  const members = await listStaffMembers(businessId);

  return members
    .filter((member) => member.is_active)
    .map((member) => ({
      id: member.id,
      name: member.name,
      role: member.role,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getTodayAttendance(
  businessId: string
): Promise<StaffAttendanceRow[]> {
  return getAttendanceForDate(businessId, todayCalendarDay());
}

async function getAttendanceForDate(
  businessId: string,
  date: string
): Promise<StaffAttendanceRow[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("staff_attendance")
    .select("*")
    .eq("business_id", businessId)
    .eq("attendance_date", date);

  if (error) {
    console.error("getAttendanceForDate:", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapAttendanceRow(row as AttendanceDbRow));
}

export async function getMonthAttendance(
  businessId: string,
  year: number,
  month: number,
  activeStaff: ActiveStaffMember[] = []
): Promise<MonthAttendanceData> {
  const supabase = createClient();
  const { start, end } = monthCalendarBounds(year, month);
  const monthDays = listIstMonthDaysUpToToday(year, month);

  const [{ data: attendanceRows, error: attendanceError }, { data: fineRows, error: finesError }, outstandingFines] =
    await Promise.all([
      supabase
        .from("staff_attendance")
        .select("staff_id, staff_name, status, attendance_date")
        .eq("business_id", businessId)
        .gte("attendance_date", start)
        .lte("attendance_date", end),
      supabase
        .from("staff_fines")
        .select("staff_id, staff_name, amount")
        .eq("business_id", businessId)
        .gte("fine_date", start)
        .lte("fine_date", end),
      fetchOutstandingFines(businessId),
    ]);

  if (attendanceError) {
    console.error("getMonthAttendance attendance:", attendanceError.message);
  }
  if (finesError) {
    console.error("getMonthAttendance fines:", finesError.message);
  }

  const summaryMap = new Map<string, MonthStaffAttendanceSummary>();
  const statusByStaffDate = new Map<string, Map<string, AttendanceStatus>>();

  for (const member of activeStaff) {
    summaryMap.set(member.id, {
      staffId: member.id,
      staffName: member.name,
      presentDays: 0,
      lateDays: 0,
      absentDays: 0,
      totalFines: 0,
    });
    statusByStaffDate.set(member.id, new Map());
  }

  for (const row of attendanceRows ?? []) {
    const staffId = row.staff_id as string;
    const staffName = normalizeStaffName(row.staff_name as string);
    const attendanceDate = row.attendance_date as string;
    const status = row.status as AttendanceStatus;

    const existing = summaryMap.get(staffId) ?? {
      staffId,
      staffName,
      presentDays: 0,
      lateDays: 0,
      absentDays: 0,
      totalFines: 0,
    };

    if (!summaryMap.has(staffId)) {
      summaryMap.set(staffId, existing);
      statusByStaffDate.set(staffId, new Map());
    }

    if (status === "present") existing.presentDays += 1;
    else if (status === "late") existing.lateDays += 1;
    else if (status === "absent") existing.absentDays += 1;

    summaryMap.set(staffId, existing);

    const staffDates =
      statusByStaffDate.get(staffId) ?? new Map<string, AttendanceStatus>();
    if (
      status === "present" ||
      status === "late" ||
      status === "absent"
    ) {
      staffDates.set(attendanceDate, status);
    }
    statusByStaffDate.set(staffId, staffDates);
  }

  for (const row of fineRows ?? []) {
    const staffId = row.staff_id as string;
    const staffName = normalizeStaffName(row.staff_name as string);
    const amount = roundMoney(Number(row.amount ?? 0));

    const existing = summaryMap.get(staffId) ?? {
      staffId,
      staffName,
      presentDays: 0,
      lateDays: 0,
      absentDays: 0,
      totalFines: 0,
    };

    existing.totalFines = roundMoney(existing.totalFines + amount);
    summaryMap.set(staffId, existing);
  }

  const summaries = Array.from(summaryMap.values()).sort((a, b) =>
    a.staffName.localeCompare(b.staffName)
  );

  const staffDetails: StaffMonthDetail[] = summaries.map((summary) => {
    const byDate = statusByStaffDate.get(summary.staffId) ?? new Map();
    const days: MonthDayRecord[] = monthDays.map((date) => {
      const { dateLabel, dayLabel } = formatMonthDayLabels(date);
      return {
        date,
        dateLabel,
        dayLabel,
        status: byDate.get(date) ?? null,
      };
    });

    return { ...summary, days };
  });

  const totalOutstandingFines = roundMoney(
    outstandingFines.reduce((sum, fine) => sum + fine.amount, 0)
  );

  return { summaries, staffDetails, totalOutstandingFines, monthDays };
}

export async function getOutstandingFines(
  businessId: string
): Promise<StaffFineRow[]> {
  return fetchOutstandingFines(businessId);
}

export async function markAttendance(params: {
  businessId: string;
  staffId: string;
  staffName: string;
  date?: string;
  status: AttendanceStatus;
  notes?: string | null;
  lateFineAmount?: number;
}): Promise<MarkAttendanceResult> {
  const { businessId, staffId, staffName, status, notes } = params;
  const date = params.date ?? todayCalendarDay();

  if (status !== "present" && status !== "absent" && status !== "late") {
    return { ok: false, error: "Invalid attendance status." };
  }

  const supabase = createClient();
  const normalizedName = normalizeStaffName(staffName);
  const fineAmount =
    params.lateFineAmount !== undefined
      ? roundMoney(params.lateFineAmount)
      : await getBusinessLateFineAmount(businessId);

  const { data: existing, error: existingError } = await supabase
    .from("staff_attendance")
    .select("id, status")
    .eq("business_id", businessId)
    .eq("staff_id", staffId)
    .eq("attendance_date", date)
    .maybeSingle();

  if (existingError) {
    console.error("markAttendance existing:", existingError.message);
    return { ok: false, error: existingError.message };
  }

  const previousStatus = existing?.status as AttendanceStatus | undefined;
  let attendanceId: string;

  if (existing?.id) {
    const { data, error } = await supabase
      .from("staff_attendance")
      .update({
        status,
        staff_name: normalizedName,
        marked_at: new Date().toISOString(),
        notes: notes ?? null,
      })
      .eq("id", existing.id)
      .select("id")
      .maybeSingle();

    if (error || !data?.id) {
      console.error("markAttendance update:", error?.message);
      return { ok: false, error: error?.message ?? "Attendance update fail." };
    }

    attendanceId = data.id;
  } else {
    const { data, error } = await supabase
      .from("staff_attendance")
      .insert({
        business_id: businessId,
        staff_id: staffId,
        staff_name: normalizedName,
        attendance_date: date,
        status,
        notes: notes ?? null,
      })
      .select("id")
      .maybeSingle();

    if (error || !data?.id) {
      console.error("markAttendance insert:", error?.message);
      return { ok: false, error: error?.message ?? "Attendance save fail." };
    }

    attendanceId = data.id;
  }

  let fineCreated = false;
  let fineRemoved = false;

  if (previousStatus === "late" && status !== "late") {
    const removed = await voidOutstandingFinesForAttendance(
      businessId,
      attendanceId
    );
    fineRemoved = removed > 0;
  }

  if (status === "late" && previousStatus !== "late" && fineAmount > 0) {
    const fineResult = await createFineForLateAttendance({
      businessId,
      staffId,
      staffName: normalizedName,
      attendanceId,
      fineDate: date,
      amount: fineAmount,
    });

    if (!fineResult.ok) {
      return { ok: false, error: fineResult.error };
    }

    fineCreated = true;
  }

  return {
    ok: true,
    status,
    fineCreated,
    fineRemoved,
    fineAmount,
  };
}

export function currentIstYearMonth(): { year: number; month: number } {
  const today = todayCalendarDay();
  const [year, month] = today.split("-").map(Number);
  return { year, month };
}

export function formatIstDateHeader(day: string = todayCalendarDay()): string {
  const { formatted, weekdayLabel } = getIstDateParts(day);
  return `Aaj — ${formatted}, ${weekdayLabel}`;
}

export function getIstDateParts(day: string = todayCalendarDay()): {
  formatted: string;
  weekdayLabel: string;
} {
  const date = new Date(`${day}T12:00:00+05:30`);
  const weekday = date.toLocaleDateString("hi-IN", {
    weekday: "long",
    timeZone: "Asia/Kolkata",
  });
  const formatted = date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
  const weekdayLabel = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return { formatted, weekdayLabel };
}

export function formatIstMonthLabel(year: number, month: number): string {
  const date = new Date(`${year}-${String(month).padStart(2, "0")}-15T12:00:00+05:30`);
  return date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}
