"use server";

import {
  getUserMembership,
  isOwnerOrAdmin,
} from "@/lib/auth/membership";
import { enrichOpeningHours } from "@/lib/booking/opening-hours";
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
    daily_revenue_target = parsed > 0 ? parsed : null;
  }

  const { data: existingBusiness } = await supabase
    .from("businesses")
    .select("opening_hours")
    .eq("id", membership.businessId)
    .maybeSingle();

  const opening_hours = enrichOpeningHours(
    openingHoursNote,
    existingBusiness?.opening_hours
  );

  const { error } = await supabase
    .from("businesses")
    .update({
      name,
      phone,
      email,
      opening_hours,
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

export async function updateReviewsSocialSettings(
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
      error: "Sirf owner ya admin reviews settings update kar sakte hain.",
    };
  }

  const reviewPromptEnabled = formData.get("review_prompt_enabled") === "true";
  const instagramPromptEnabled =
    formData.get("instagram_prompt_enabled") === "true";
  const googleReviewUrl =
    (formData.get("google_review_url") as string)?.trim() || null;
  const instagramUrl = (formData.get("instagram_url") as string)?.trim() || null;

  if (reviewPromptEnabled && !googleReviewUrl) {
    return {
      ok: false,
      error: "Google review on karne ke liye link daalein.",
    };
  }

  if (instagramPromptEnabled && !instagramUrl) {
    return {
      ok: false,
      error: "Instagram on karne ke liye profile link daalein.",
    };
  }

  const { error } = await supabase
    .from("businesses")
    .update({
      review_prompt_enabled: reviewPromptEnabled,
      google_review_url: googleReviewUrl,
      google_review_link: googleReviewUrl,
      instagram_prompt_enabled: instagramPromptEnabled,
      instagram_url: instagramUrl,
    })
    .eq("id", membership.businessId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/settings");
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

export async function updateAttendanceSettings(
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
      error: "Sirf owner ya admin attendance settings update kar sakte hain.",
    };
  }

  const raw = (formData.get("late_fine_amount") as string)?.trim();
  const parsed = parseFloat(raw || "0");

  if (Number.isNaN(parsed) || parsed < 0) {
    return {
      ok: false,
      error: "Late fine amount 0 ya usse zyada hona chahiye.",
    };
  }

  const { error } = await supabase
    .from("businesses")
    .update({ late_fine_amount: parsed })
    .eq("id", membership.businessId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/attendance");
  revalidatePath("/dashboard/money");
  return { ok: true };
}

export async function updateGstSettings(
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
      error: "Sirf owner ya admin GST settings update kar sakte hain.",
    };
  }

  const gstEnabled = formData.get("gst_enabled") === "true";
  const gstNumber = (formData.get("gst_number") as string)?.trim() || null;
  const gstRateRaw = (formData.get("gst_rate") as string)?.trim();
  const gstInclusive = formData.get("gst_inclusive") === "true";

  let gst_rate = 18;
  if (gstRateRaw) {
    const parsed = parseFloat(gstRateRaw);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
      return {
        ok: false,
        error: "GST rate 0 se 100 ke beech valid number hona chahiye.",
      };
    }
    gst_rate = parsed;
  } else if (gstEnabled) {
    return {
      ok: false,
      error: "GST on karne ke liye rate daalein.",
    };
  }

  const { error } = await supabase
    .from("businesses")
    .update({
      gst_enabled: gstEnabled,
      gst_number: gstNumber,
      gst_rate,
      gst_inclusive: gstInclusive,
    })
    .eq("id", membership.businessId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/settings");
  return { ok: true };
}

export async function updateOnlineBookingSettings(
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
      error: "Sirf owner ya admin online booking settings update kar sakte hain.",
    };
  }

  const onlineBookingEnabled =
    formData.get("online_booking_enabled") === "true";

  const { error } = await supabase
    .from("businesses")
    .update({ online_booking_enabled: onlineBookingEnabled })
    .eq("id", membership.businessId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/settings");
  return { ok: true };
}

export async function updateUiLanguage(
  uiLanguage: string
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
      error: "Sirf owner ya admin language change kar sakte hain.",
    };
  }

  if (uiLanguage !== "en" && uiLanguage !== "hi") {
    return { ok: false, error: "Invalid language selection." };
  }

  const { error } = await supabase
    .from("businesses")
    .update({ ui_language: uiLanguage })
    .eq("id", membership.businessId);

  if (error) {
    return { ok: false, error: error.message };
  }

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
