import type { SupabaseClient } from "@supabase/supabase-js";
import { parseOpeningHours } from "@/lib/onboarding/skips";

export type OnboardingStep =
  | "business"
  | "branch"
  | "staff"
  | "services"
  | "complete";

export async function getOnboardingStep(
  supabase: SupabaseClient
): Promise<OnboardingStep> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return "business";
  }

  const { data: member } = await supabase
    .from("business_members")
    .select("business_id, app_role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (member?.app_role === "staff" || member?.app_role === "admin") {
    return "complete";
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, opening_hours")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!business) {
    return "business";
  }

  const skips = parseOpeningHours(business.opening_hours).onboarding_skips ?? {};

  const { data: branch } = await supabase
    .from("branches")
    .select("id")
    .eq("business_id", business.id)
    .limit(1)
    .maybeSingle();

  if (!branch) {
    return "branch";
  }

  const { count: staffCount } = await supabase
    .from("staff")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id);

  if (!staffCount && !skips.staff) {
    return "staff";
  }

  const { count: serviceCount } = await supabase
    .from("services")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id);

  if (!serviceCount && !skips.services) {
    return "services";
  }

  return "complete";
}

export function onboardingPathForStep(step: OnboardingStep): string {
  switch (step) {
    case "business":
      return "/onboarding/business";
    case "branch":
      return "/onboarding/branch";
    case "staff":
      return "/onboarding/staff";
    case "services":
      return "/onboarding/services";
    case "complete":
      return "/dashboard";
  }
}

export async function getOnboardingRedirect(
  supabase: SupabaseClient
): Promise<string> {
  const step = await getOnboardingStep(supabase);
  return onboardingPathForStep(step);
}
