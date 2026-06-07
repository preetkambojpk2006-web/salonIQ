"use server";

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

  const trimmed = link.trim();

  const { error } = await supabase
    .from("businesses")
    .update({ google_review_link: trimmed || null })
    .eq("owner_id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/calendar");
  return { ok: true };
}
