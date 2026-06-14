"use server";

import {
  getUserMembership,
  isOwnerOrAdmin,
} from "@/lib/auth/membership";
import { getOwnerBusinessId } from "@/lib/customers/queries";
import {
  insertStaffAdvance,
  normalizeStaffName,
  roundMoney,
  settleOutstandingAdvancesForStaff,
} from "@/lib/staff/advances";
import { settleOutstandingFinesForStaff } from "@/lib/staff/fines";
import { getGrossUnpaidCommissionForStaff } from "@/lib/staff/payouts";
import type {
  RecordStaffAdvanceResult,
  SettleStaffPayoutResult,
} from "@/lib/staff/types";
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
      error: "Sirf owner ya admin staff advances manage kar sakte hain.",
    };
  }

  return { ok: true, businessId: membership.businessId };
}

function parseAdvanceAmount(value: FormDataEntryValue | null): number | null {
  const amount = parseFloat(String(value ?? ""));
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }
  return roundMoney(amount);
}

export async function recordStaffAdvance(
  formData: FormData
): Promise<RecordStaffAdvanceResult> {
  const access = await requireOwnerOrAdmin();
  if (!access.ok) return access;

  const staffName = (formData.get("staff_name") as string)?.trim();
  const staffId = (formData.get("staff_id") as string)?.trim() || null;
  const amount = parseAdvanceAmount(formData.get("amount"));
  const note = (formData.get("note") as string)?.trim() || null;

  if (!staffName) {
    return { ok: false, error: "Staff choose karein." };
  }

  if (amount == null) {
    return { ok: false, error: "Valid advance amount daalein." };
  }

  const result = await insertStaffAdvance({
    businessId: access.businessId,
    staffName,
    staffId,
    amount,
    note,
  });

  if (!result.ok) {
    return result;
  }

  revalidatePath("/dashboard/money");
  return result;
}

export async function settleStaffPayout(
  formData: FormData
): Promise<SettleStaffPayoutResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Please sign in again." };
  }

  const businessId = await getOwnerBusinessId();
  if (!businessId) {
    return { ok: false, error: "Set up your salon first." };
  }

  const membership = await getUserMembership();
  if (!membership?.businessId || !isOwnerOrAdmin(membership.appRole)) {
    return {
      ok: false,
      error: "Sirf owner ya admin staff payout settle kar sakte hain.",
    };
  }

  const rawStaffName = (formData.get("staff_name") as string)?.trim();
  if (!rawStaffName) {
    return { ok: false, error: "Staff name missing." };
  }

  const staffName = normalizeStaffName(rawStaffName);

  const grossUnpaid = await getGrossUnpaidCommissionForStaff(
    businessId,
    staffName
  );

  if (grossUnpaid <= 0) {
    return {
      ok: false,
      error: "Is staff ka koi unpaid commission nahi hai.",
    };
  }

  const settledAt = new Date().toISOString();

  const { error: earningsError } = await supabase
    .from("staff_earnings")
    .update({ status: "paid" })
    .eq("business_id", businessId)
    .eq("staff_name", staffName)
    .eq("status", "unpaid");

  if (earningsError) {
    console.error("settleStaffPayout earnings:", earningsError.message);
    return { ok: false, error: earningsError.message };
  }

  const fineApplied = await settleOutstandingFinesForStaff({
    businessId,
    staffName,
    deductionBudget: grossUnpaid,
    deductedAt: settledAt,
  });

  const advanceApplied = await settleOutstandingAdvancesForStaff({
    businessId,
    staffName,
    deductionBudget: roundMoney(grossUnpaid - fineApplied),
    settledAt,
  });

  const netPaid = roundMoney(
    Math.max(0, grossUnpaid - fineApplied - advanceApplied)
  );

  revalidatePath("/dashboard/money");
  revalidatePath("/dashboard/attendance");
  return {
    ok: true,
    grossUnpaid,
    fineApplied,
    advanceApplied,
    netPaid,
  };
}
