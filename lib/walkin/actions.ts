"use server";

import {
  getUserMembership,
  isOwnerOrAdmin,
} from "@/lib/auth/membership";
import {
  listTodayWalkinQueue,
  updateWalkinStatus,
  type WalkinQueueRow,
} from "@/lib/walkin/queries";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type WalkinQueueAction = "call" | "start" | "done" | "no_show" | "remove";

export type WalkinQueueActionResult =
  | { ok: true; queue: WalkinQueueRow[]; message: string }
  | { ok: false; error: string };

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
      error: "Sirf owner ya admin walk-in queue manage kar sakte hain.",
    };
  }

  return { ok: true, businessId: membership.businessId };
}

export async function performWalkinQueueAction(
  businessId: string,
  entryId: string,
  action: WalkinQueueAction
): Promise<WalkinQueueActionResult> {
  const access = await requireOwnerOrAdmin();
  if (!access.ok) return access;

  if (access.businessId !== businessId) {
    return { ok: false, error: "Yeh queue entry aapke salon ki nahi hai." };
  }

  const trimmedId = entryId.trim();
  if (!trimmedId) {
    return { ok: false, error: "Queue entry nahi mili." };
  }

  const now = new Date().toISOString();
  let status: string;
  let extraFields: {
    called_at?: string;
    service_started_at?: string;
    completed_at?: string;
  } = {};
  let message: string;

  switch (action) {
    case "call":
      status = "called";
      extraFields = { called_at: now };
      message = "Customer ko bulaya gaya";
      break;
    case "start":
      status = "in_service";
      extraFields = { service_started_at: now };
      message = "Service shuru ho gayi";
      break;
    case "done":
      status = "done";
      extraFields = { completed_at: now };
      message = "Done mark ho gaya";
      break;
    case "no_show":
      status = "no_show";
      extraFields = { completed_at: now };
      message = "No-show mark ho gaya";
      break;
    case "remove":
      status = "left";
      message = "Queue se hata diya";
      break;
    default:
      return { ok: false, error: "Invalid action" };
  }

  const result = await updateWalkinStatus(trimmedId, status, extraFields);
  if (!result.ok) {
    return result;
  }

  revalidatePath("/dashboard");
  const queue = await listTodayWalkinQueue(businessId);
  return { ok: true, queue, message };
}
