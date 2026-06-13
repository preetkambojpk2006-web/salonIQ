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
  const dailyRevenueTargetRaw = (
    formData.get("daily_revenue_target") as string
  )?.trim();

  if (!name) {
    return { ok: false, error: "Salon naam zaroori hai." };
  }

  let daily_revenue_target: number | null = null;
  if (dailyRevenueTargetRaw) {
    const parsed = parseFloat(dailyRevenueTargetRaw);
    if (Number.isNaN(parsed) || parsed < 0) {
      return {
        ok: false,
        error: "Aaj ka revenue target valid number hona chahiye (0 ya usse zyada).",
      };
    }
    daily_revenue_target = parsed;
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
      daily_revenue_target,
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

export async function updateLoyaltySettings(
  formData: FormData
): Promise<SettingsActionResult> {
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
      error: "Sirf owner ya admin loyalty settings update kar sakte hain.",
    };
  }

  const rewardEnabled = formData.get("reward_enabled") === "true";
  const rewardTypeRaw = (formData.get("reward_type") as string)?.trim();
  const rewardType = rewardTypeRaw === "spend" ? "spend" : "visits";
  const thresholdRaw = (formData.get("reward_threshold") as string)?.trim();
  const rewardDescription =
    (formData.get("reward_description") as string)?.trim() || null;

  let reward_threshold = 10;
  if (thresholdRaw) {
    const parsed = parseFloat(thresholdRaw);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return {
        ok: false,
        error: "Threshold 0 se zyada hona chahiye.",
      };
    }
    if (rewardType === "visits" && !Number.isInteger(parsed)) {
      return {
        ok: false,
        error: "Visits threshold poore number mein hona chahiye (e.g. 10).",
      };
    }
    reward_threshold = parsed;
  } else if (rewardEnabled) {
    return {
      ok: false,
      error: "Reward on karne ke liye threshold daalein.",
    };
  }

  if (rewardEnabled && !rewardDescription) {
    return {
      ok: false,
      error: "Reward on karne ke liye batayein customer ko kya milega (e.g. Free Haircut).",
    };
  }

  const { error } = await supabase
    .from("businesses")
    .update({
      reward_enabled: rewardEnabled,
      reward_type: rewardType,
      reward_threshold,
      reward_description: rewardDescription,
    })
    .eq("id", membership.businessId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/customers");
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
