"use server";

import {
  getUserMembership,
  isOwnerOrAdmin,
} from "@/lib/auth/membership";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type SettingsActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateBusinessSettings(formData: FormData): Promise<SettingsActionResult> {
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

  const name = (formData.get("name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || null;
  const email = (formData.get("email") as string)?.trim() || null;
  const openingHoursNote =
    (formData.get("opening_hours") as string)?.trim() || null;
  const googleReviewLink =
    (formData.get("google_review_link") as string)?.trim() || null;

  if (!name) {
    return { ok: false, error: "Salon naam zaroori hai." };
  }

  const opening_hours = openingHoursNote
    ? { display: openingHoursNote }
    : {};

  const { error } = await supabase
    .from("businesses")
    .update({
      name,
      phone,
      email,
      opening_hours,
      google_review_link: googleReviewLink,
    })
    .eq("id", membership.businessId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/calendar");
  return { ok: true };
}

export async function changePassword(formData: FormData): Promise<SettingsActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const newPassword = formData.get("new_password") as string;
  const confirmPassword = formData.get("confirm_password") as string;

  if (!newPassword || newPassword.length < 6) {
    return { ok: false, error: "Naya password kam se kam 6 characters hona chahiye." };
  }

  if (newPassword !== confirmPassword) {
    return { ok: false, error: "Password match nahi kar rahe." };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
