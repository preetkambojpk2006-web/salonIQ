"use server";

import {
  checkInStaffAttendance,
  correctStaffAttendanceStatus,
  markStaffAbsentAttendance,
} from "@/lib/attendance/queries";
import type {
  AttendanceStatus,
  MarkAttendanceResult,
} from "@/lib/attendance/types";
import {
  getUserMembership,
  isOwnerOrAdmin,
} from "@/lib/auth/membership";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
      error: "Only owner or admin can manage attendance.",
    };
  }

  return { ok: true, businessId: membership.businessId };
}

function parseLateFineAmount(formData: FormData): number | undefined {
  const lateFineRaw = (formData.get("late_fine_amount") as string)?.trim();
  return lateFineRaw && Number.isFinite(Number(lateFineRaw))
    ? Number(lateFineRaw)
    : undefined;
}

function parseStaffForm(formData: FormData): {
  staffId: string;
  staffName: string;
} | { error: string } {
  const staffId = (formData.get("staff_id") as string)?.trim();
  const staffName = (formData.get("staff_name") as string)?.trim();

  if (!staffId || !staffName) {
    return { error: "Staff info missing." };
  }

  return { staffId, staffName };
}

async function revalidateAttendance(result: MarkAttendanceResult) {
  if (result.ok) {
    revalidatePath("/dashboard/attendance");
  }
  return result;
}

/** Server-time check-in — ignores any client date/time. */
export async function checkInStaff(
  formData: FormData
): Promise<MarkAttendanceResult> {
  const access = await requireOwnerOrAdmin();
  if (!access.ok) return access;

  const staff = parseStaffForm(formData);
  if ("error" in staff) return { ok: false, error: staff.error };

  return revalidateAttendance(
    await checkInStaffAttendance({
      businessId: access.businessId,
      staffId: staff.staffId,
      staffName: staff.staffName,
      lateFineAmount: parseLateFineAmount(formData),
    })
  );
}

export async function markStaffAbsent(
  formData: FormData
): Promise<MarkAttendanceResult> {
  const access = await requireOwnerOrAdmin();
  if (!access.ok) return access;

  const staff = parseStaffForm(formData);
  if ("error" in staff) return { ok: false, error: staff.error };

  return revalidateAttendance(
    await markStaffAbsentAttendance({
      businessId: access.businessId,
      staffId: staff.staffId,
      staffName: staff.staffName,
      lateFineAmount: parseLateFineAmount(formData),
    })
  );
}

/** Owner correction — status only, check-in time unchanged. */
export async function correctStaffAttendance(
  formData: FormData
): Promise<MarkAttendanceResult> {
  const access = await requireOwnerOrAdmin();
  if (!access.ok) return access;

  const staff = parseStaffForm(formData);
  if ("error" in staff) return { ok: false, error: staff.error };

  const statusRaw = (formData.get("status") as string)?.trim();
  if (
    statusRaw !== "present" &&
    statusRaw !== "absent" &&
    statusRaw !== "late"
  ) {
    return { ok: false, error: "Invalid status." };
  }

  const status = statusRaw as AttendanceStatus;

  return revalidateAttendance(
    await correctStaffAttendanceStatus({
      businessId: access.businessId,
      staffId: staff.staffId,
      staffName: staff.staffName,
      status,
      lateFineAmount: parseLateFineAmount(formData),
    })
  );
}
