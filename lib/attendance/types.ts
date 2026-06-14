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

export type MarkAttendanceResult =
  | {
      ok: true;
      status: AttendanceStatus;
      fineCreated: boolean;
      fineRemoved: boolean;
      fineAmount: number;
    }
  | { ok: false; error: string };
