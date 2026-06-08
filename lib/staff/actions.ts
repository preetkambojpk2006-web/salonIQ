"use server";

import { getOwnerBusinessId } from "@/lib/customers/queries";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type SettleStaffPayoutResult =
  | { ok: true }
  | { ok: false; error: string };

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

  const staffName = (formData.get("staff_name") as string)?.trim();
  if (!staffName) {
    return { ok: false, error: "Staff name missing." };
  }

  const { error } = await supabase
    .from("staff_earnings")
    .update({ status: "paid" })
    .eq("business_id", businessId)
    .eq("staff_name", staffName)
    .eq("status", "unpaid");

  if (error) {
    console.error("settleStaffPayout:", error.message);
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/money");
  return { ok: true };
}
