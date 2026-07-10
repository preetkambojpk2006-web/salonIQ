export type AttendanceStatus = "present" | "absent" | "late";

export type StaffAttendanceRow = {
  id: string;
  business_id: string;
  staff_id: string;
  staff_name: string;
  attendance_date: string;
  status: AttendanceStatus;
  marked_at: string;
  notes: string | null;
  owner_corrected: boolean;
};

export type StaffFineRow = {
  id: string;
  business_id: string;
  staff_id: string;
  staff_name: string;
  attendance_id: string | null;
  amount: number;
  reason: string;
  fine_date: string;
  status: "outstanding" | "deducted";
  deducted_at: string | null;
};

export type ActiveStaffMember = {
  id: string;
  name: string;
  role: string | null;
};

export type MonthStaffAttendanceSummary = {
  staffId: string;
  staffName: string;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  totalFines: number;
};

export type MonthDayRecord = {
  date: string;
  dateLabel: string;
  dayLabel: string;
  status: AttendanceStatus | null;
  checkInTimeLabel: string | null;
  ownerCorrected: boolean;
};

export type AttendanceRecordEntry = {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  dateLabel: string;
  dayLabel: string;
  status: AttendanceStatus;
  checkInTimeLabel: string | null;
  ownerCorrected: boolean;
};

export type AttendanceRecordsPeriod = {
  entries: AttendanceRecordEntry[];
  periodLabel: string;
};

export type StaffMonthDetail = MonthStaffAttendanceSummary & {
  days: MonthDayRecord[];
};

export type MonthAttendanceData = {
  summaries: MonthStaffAttendanceSummary[];
  staffDetails: StaffMonthDetail[];
  totalOutstandingFines: number;
  monthDays: string[];
};

export type MarkAttendanceResult =
  | {
      ok: true;
      status: AttendanceStatus;
      fineCreated: boolean;
      fineRemoved: boolean;
      fineAmount: number;
      markedAt?: string;
    }
  | { ok: false; error: string };
