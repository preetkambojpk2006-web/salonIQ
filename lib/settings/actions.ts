"use server";

import {
  getUserMembership,
  isOwnerOrAdmin,
} from "@/lib/auth/membership";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type UpdateGoogleReviewLinkResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateGoogleReviewLink(
  link: string
): Promise<UpdateGoogleReviewLinkResult> {
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
      error: "Sirf owner ya admin settings update kar sakte hain.",
    };
  }

  const trimmed = link.trim();

  const { error } = await supabase
    .from("businesses")
    .update({ google_review_link: trimmed || null })
    .eq("id", membership.businessId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/calendar");
  return { ok: true };
}
