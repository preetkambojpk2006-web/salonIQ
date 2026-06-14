"use server";

import {
  getUserMembership,
  isOwnerOrAdmin,
} from "@/lib/auth/membership";
import { markAttendance as markAttendanceDb } from "@/lib/attendance/queries";
import type {
  AttendanceStatus,
  MarkAttendanceResult,
} from "@/lib/attendance/types";
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
      error: "Sirf owner ya admin attendance mark kar sakte hain.",
    };
  }

  return { ok: true, businessId: membership.businessId };
}

export async function markStaffAttendance(
  formData: FormData
): Promise<MarkAttendanceResult> {
  const access = await requireOwnerOrAdmin();
  if (!access.ok) return access;

  const staffId = (formData.get("staff_id") as string)?.trim();
  const staffName = (formData.get("staff_name") as string)?.trim();
  const statusRaw = (formData.get("status") as string)?.trim();
  const date = (formData.get("date") as string)?.trim() || undefined;

  if (!staffId || !staffName) {
    return { ok: false, error: "Staff info missing." };
  }

  if (
    statusRaw !== "present" &&
    statusRaw !== "absent" &&
    statusRaw !== "late"
  ) {
    return { ok: false, error: "Invalid status." };
  }

  const status = statusRaw as AttendanceStatus;

  const result = await markAttendanceDb({
    businessId: access.businessId,
    staffId,
    staffName,
    date,
    status,
  });

  if (result.ok) {
    revalidatePath("/dashboard/attendance");
    revalidatePath("/dashboard/money");
  }

  return result;
}
