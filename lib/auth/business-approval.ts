import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getOnboardingStep,
  onboardingPathForStep,
} from "@/lib/onboarding/status";

export type BusinessApprovalStatus = {
  businessId: string | null;
  isApproved: boolean;
  onboardingComplete: boolean;
};

async function resolveBusinessId(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data: ownedBusiness } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();

  if (ownedBusiness?.id) {
    return ownedBusiness.id;
  }

  const { data: membership } = await supabase
    .from("business_members")
    .select("business_id")
    .eq("user_id", userId)
    .maybeSingle();

  return membership?.business_id ?? null;
}

export async function getBusinessApprovalStatus(
  supabase: SupabaseClient,
  userId: string
): Promise<BusinessApprovalStatus> {
  const step = await getOnboardingStep(supabase);
  const onboardingComplete = step === "complete";

  if (!onboardingComplete) {
    return {
      businessId: null,
      isApproved: false,
      onboardingComplete: false,
    };
  }

  const businessId = await resolveBusinessId(supabase, userId);
  if (!businessId) {
    return {
      businessId: null,
      isApproved: false,
      onboardingComplete: true,
    };
  }

  const { data: business, error } = await supabase
    .from("businesses")
    .select("is_approved")
    .eq("id", businessId)
    .maybeSingle();

  if (error || !business) {
    return {
      businessId,
      isApproved: false,
      onboardingComplete: true,
    };
  }

  return {
    businessId,
    isApproved: business.is_approved === true,
    onboardingComplete: true,
  };
}

/** Post-login landing: onboarding step, pending review, or dashboard. */
export async function getAuthenticatedLandingPath(
  supabase: SupabaseClient
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return "/login";
  }

  const step = await getOnboardingStep(supabase);
  if (step !== "complete") {
    return onboardingPathForStep(step);
  }

  const approval = await getBusinessApprovalStatus(supabase, user.id);
  if (!approval.isApproved) {
    return "/pending";
  }

  return "/dashboard";
}
