import { AttendanceView } from "@/components/attendance/attendance-view";
import { getUserMembership, isOwnerOrAdmin } from "@/lib/auth/membership";
import {
  currentIstYearMonth,
  formatIstMonthLabel,
  getActiveStaff,
  getBusinessLateFineAmount,
  getMonthAttendance,
  getMonthAttendanceRecords,
  getTodayAttendance,
  getWeekAttendanceRecords,
  getIstDateParts,
} from "@/lib/attendance/queries";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const membership = await getUserMembership();

  if (!membership?.businessId) {
    redirect("/onboarding");
  }

  if (!isOwnerOrAdmin(membership.appRole)) {
    redirect("/dashboard");
  }

  const businessId = membership.businessId;
  const { year, month } = currentIstYearMonth();

  const [staff, todayAttendance, weekRecords, monthRecords, lateFineAmount] =
    await Promise.all([
      getActiveStaff(businessId),
      getTodayAttendance(businessId),
      getWeekAttendanceRecords(businessId),
      getMonthAttendanceRecords(businessId),
      getBusinessLateFineAmount(businessId),
    ]);

  const monthData = await getMonthAttendance(businessId, year, month, staff);

  const { formatted: todayDate, weekdayLabel: todayWeekday } = getIstDateParts();

  return (
    <AttendanceView
      businessId={businessId}
      staff={staff}
      todayAttendance={todayAttendance}
      monthSummaries={monthData.summaries}
      weekRecords={weekRecords}
      monthRecords={monthRecords}
      totalOutstandingFines={monthData.totalOutstandingFines}
      todayDate={todayDate}
      todayWeekday={todayWeekday}
      monthLabel={formatIstMonthLabel(year, month)}
      lateFineAmount={lateFineAmount}
    />
  );
}
