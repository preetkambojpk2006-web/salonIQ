"use server";

import {
  getUserMembership,
  isOwnerOrAdmin,
} from "@/lib/auth/membership";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type HappyHourActionResult =
  | { ok: true }
  | { ok: false; error: string };

const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

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
      error: "Sirf owner ya admin happy hours manage kar sakte hain.",
    };
  }

  return { ok: true, businessId: membership.businessId };
}

function revalidateHappyHourPaths() {
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/calendar");
  revalidatePath("/book");
}

function parseDayOfWeek(value: FormDataEntryValue | null): number | null {
  const parsed = Number(String(value ?? "").trim());
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 6) {
    return null;
  }
  return parsed;
}

function parseTimeValue(value: FormDataEntryValue | null): string | null {
  const trimmed = String(value ?? "").trim();
  if (!/^\d{2}:\d{2}$/.test(trimmed)) {
    return null;
  }
  const [hourRaw, minuteRaw] = trimmed.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
}

function parseDiscountPercent(value: FormDataEntryValue | null): number | null {
  const parsed = Number(String(value ?? "").trim());
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100) {
    return null;
  }
  return Math.round(parsed * 100) / 100;
}

function buildRuleName(dayOfWeek: number, startTime: string, discountPercent: number): string {
  const dayLabel = DAY_LABELS[dayOfWeek] ?? "Day";
  const startLabel = startTime.slice(0, 5);
  return `${dayLabel} ${startLabel} (${discountPercent}% off)`;
}

export async function createHappyHourRule(
  formData: FormData
): Promise<HappyHourActionResult> {
  const access = await requireOwnerOrAdmin();
  if (!access.ok) return access;

  const dayOfWeek = parseDayOfWeek(formData.get("day_of_week"));
  const startTime = parseTimeValue(formData.get("start_time"));
  const endTime = parseTimeValue(formData.get("end_time"));
  const discountPercent = parseDiscountPercent(formData.get("discount_percent"));

  if (dayOfWeek == null) {
    return { ok: false, error: "Valid day select karein." };
  }
  if (!startTime || !endTime) {
    return { ok: false, error: "Valid start aur end time daalein." };
  }
  if (startTime >= endTime) {
    return { ok: false, error: "End time start time se baad hona chahiye." };
  }
  if (discountPercent == null) {
    return { ok: false, error: "Discount 1 se 100 ke beech hona chahiye." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("happy_hours").insert({
    business_id: access.businessId,
    name: buildRuleName(dayOfWeek, startTime, discountPercent),
    day_of_week: dayOfWeek,
    start_time: startTime,
    end_time: endTime,
    discount_percent: discountPercent,
    is_active: true,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidateHappyHourPaths();
  return { ok: true };
}

export async function toggleHappyHourRule(
  formData: FormData
): Promise<HappyHourActionResult> {
  const access = await requireOwnerOrAdmin();
  if (!access.ok) return access;

  const ruleId = (formData.get("rule_id") as string)?.trim();
  const isActive = formData.get("is_active") === "true";

  if (!ruleId) {
    return { ok: false, error: "Rule select nahi hui." };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("happy_hours")
    .update({ is_active: isActive })
    .eq("id", ruleId)
    .eq("business_id", access.businessId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data) {
    return { ok: false, error: "Rule update nahi ho payi." };
  }

  revalidateHappyHourPaths();
  return { ok: true };
}

export async function deleteHappyHourRule(
  formData: FormData
): Promise<HappyHourActionResult> {
  const access = await requireOwnerOrAdmin();
  if (!access.ok) return access;

  const ruleId = (formData.get("rule_id") as string)?.trim();
  if (!ruleId) {
    return { ok: false, error: "Rule select nahi hui." };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("happy_hours")
    .delete()
    .eq("id", ruleId)
    .eq("business_id", access.businessId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data) {
    return { ok: false, error: "Rule delete nahi ho payi." };
  }

  revalidateHappyHourPaths();
  return { ok: true };
}
