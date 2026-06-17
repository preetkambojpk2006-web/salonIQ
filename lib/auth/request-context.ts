import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { AppRole } from "@/lib/auth/types";
import { parseOpeningHours } from "@/lib/onboarding/skips";
import {
  onboardingPathForStep,
  type OnboardingStep,
} from "@/lib/onboarding/status";

export type RequestAuthContext = {
  appRole: AppRole | null;
  businessId: string | null;
  isApproved: boolean;
  onboardingComplete: boolean;
  onboardingStep: OnboardingStep;
};

/**
 * Single consolidated auth/onboarding/approval lookup for the middleware.
 *
 * Replaces the previous chain of resolveAppRole + getOnboardingStep +
 * getBusinessApprovalStatus (each re-querying auth + businesses + members),
 * which fired ~18 sequential round-trips on every navigation. This resolves
 * the same state in at most 3 parallel waves.
 */
export async function getRequestAuthContext(
  supabase: SupabaseClient,
  user: User
): Promise<RequestAuthContext> {
  const [{ data: ownedBusiness }, { data: membership }] = await Promise.all([
    supabase
      .from("businesses")
      .select("id, opening_hours, is_approved, onboarding_completed")
      .eq("owner_id", user.id)
      .maybeSingle(),
    supabase
      .from("business_members")
      .select("business_id, app_role")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  // Invited member (staff/admin): onboarding is complete by definition;
  // approval is inherited from the business they belong to.
  if (!ownedBusiness?.id && membership?.business_id) {
    const appRole: AppRole =
      membership.app_role === "admin" ? "admin" : "staff";

    const { data: business } = await supabase
      .from("businesses")
      .select("is_approved")
      .eq("id", membership.business_id)
      .maybeSingle();

    return {
      appRole,
      businessId: membership.business_id,
      isApproved: business?.is_approved === true,
      onboardingComplete: true,
      onboardingStep: "complete",
    };
  }

  // Brand-new user: no business, no membership → must start onboarding.
  if (!ownedBusiness?.id) {
    return {
      appRole: null,
      businessId: null,
      isApproved: false,
      onboardingComplete: false,
      onboardingStep: "business",
    };
  }

  if (ownedBusiness.onboarding_completed) {
    return {
      appRole: "owner",
      businessId: ownedBusiness.id,
      isApproved: ownedBusiness.is_approved === true,
      onboardingComplete: true,
      onboardingStep: "complete",
    };
  }

  // Owner: derive onboarding step from branch/staff/services in one wave.
  const skips =
    parseOpeningHours(ownedBusiness.opening_hours).onboarding_skips ?? {};

  const [{ data: branch }, { count: staffCount }, { count: serviceCount }] =
    await Promise.all([
      supabase
        .from("branches")
        .select("id")
        .eq("business_id", ownedBusiness.id)
        .limit(1)
        .maybeSingle(),
      supabase
        .from("staff")
        .select("id", { count: "exact", head: true })
        .eq("business_id", ownedBusiness.id),
      supabase
        .from("services")
        .select("id", { count: "exact", head: true })
        .eq("business_id", ownedBusiness.id),
    ]);

  let step: OnboardingStep = "complete";
  if (!branch) {
    step = "branch";
  } else if (!staffCount && !skips.staff) {
    step = "staff";
  } else if (!serviceCount && !skips.services) {
    step = "services";
  }

  return {
    appRole: "owner",
    businessId: ownedBusiness.id,
    isApproved: ownedBusiness.is_approved === true,
    onboardingComplete: step === "complete",
    onboardingStep: step,
  };
}

/** Post-auth landing path derived from an already-resolved context. */
export function landingPathFromContext(ctx: RequestAuthContext): string {
  if (!ctx.onboardingComplete) {
    return onboardingPathForStep(ctx.onboardingStep);
  }
  if (!ctx.isApproved) {
    return "/pending";
  }
  return "/dashboard";
}
