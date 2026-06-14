import { AttendanceView } from "@/components/attendance/attendance-view";
import { getUserMembership, isOwnerOrAdmin } from "@/lib/auth/membership";
import {
  currentIstYearMonth,
  formatIstMonthLabel,
  getActiveStaff,
  getBusinessLateFineAmount,
  getMonthAttendance,
  getTodayAttendance,
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

  const [staff, todayAttendance, monthData, lateFineAmount] = await Promise.all([
    getActiveStaff(businessId),
    getTodayAttendance(businessId),
    getMonthAttendance(businessId, year, month),
    getBusinessLateFineAmount(businessId),
  ]);

  const { formatted: todayDate, weekdayLabel: todayWeekday } = getIstDateParts();

  return (
    <AttendanceView
      staff={staff}
      todayAttendance={todayAttendance}
      monthSummaries={monthData.summaries}
      totalOutstandingFines={monthData.totalOutstandingFines}
      todayDate={todayDate}
      todayWeekday={todayWeekday}
      monthLabel={formatIstMonthLabel(year, month)}
      lateFineAmount={lateFineAmount}
    />
  );
}
