import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getCachedAuthUser } from "@/lib/auth/cached-server";
import {
  onboardingPathForStep,
  type OnboardingStep,
} from "@/lib/onboarding/paths";
import { createClient } from "@/lib/supabase/server";
import { parseOpeningHours } from "@/lib/onboarding/skips";

export type { OnboardingStep } from "@/lib/onboarding/paths";
export { onboardingPathForStep } from "@/lib/onboarding/paths";

export async function markOnboardingComplete(
  supabase: SupabaseClient,
  businessId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("businesses")
    .update({ onboarding_completed: true })
    .eq("id", businessId);

  return { error: error?.message ?? null };
}

export const getOnboardingStep = cache(async (): Promise<OnboardingStep> => {
  const supabase = createClient();
  const user = await getCachedAuthUser();

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
    .select("id, opening_hours, onboarding_completed")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!business) {
    return "business";
  }

  if (business.onboarding_completed) {
    return "complete";
  }

  const skips = parseOpeningHours(business.opening_hours).onboarding_skips ?? {};

  const [{ data: branch }, { count: staffCount }, { count: serviceCount }] =
    await Promise.all([
      supabase
        .from("branches")
        .select("id")
        .eq("business_id", business.id)
        .limit(1)
        .maybeSingle(),
      supabase
        .from("staff")
        .select("id", { count: "exact", head: true })
        .eq("business_id", business.id),
      supabase
        .from("services")
        .select("id", { count: "exact", head: true })
        .eq("business_id", business.id),
    ]);

  if (!branch) {
    return "branch";
  }

  if (!staffCount && !skips.staff) {
    return "staff";
  }

  if (!serviceCount && !skips.services) {
    return "services";
  }

  return "complete";
});

export async function getOnboardingRedirect(): Promise<string> {
  const step = await getOnboardingStep();
  return onboardingPathForStep(step);
}
