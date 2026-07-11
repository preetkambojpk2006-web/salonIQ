import { cache } from "react";
import { getUserMembership } from "@/lib/auth/membership";
import { createClient } from "@/lib/supabase/server";

export const getOwnerBusiness = cache(async () => {
  const supabase = createClient();
  const membership = await getUserMembership();

  if (!membership) return null;

  const businessFields =
    "id, name, logo_url, phone, email, opening_hours, google_review_link, google_review_url, instagram_url, review_prompt_enabled, review_filter_enabled, instagram_prompt_enabled, booking_slug, daily_revenue_target, late_fine_amount";

  const { data: business, error } = await supabase
    .from("businesses")
    .select(
      `${businessFields}, ui_language, gst_enabled, gst_number, gst_rate, gst_inclusive, online_booking_enabled`
    )
    .eq("id", membership.businessId)
    .maybeSingle();

  if (!error) {
    return business;
  }

  console.error("[getOwnerBusiness] extended fields fetch failed:", error.message);

  const { data: fallbackBusiness } = await supabase
    .from("businesses")
    .select(`${businessFields}, ui_language`)
    .eq("id", membership.businessId)
    .maybeSingle();

  if (fallbackBusiness) {
    return fallbackBusiness;
  }

  const { data: baseBusiness } = await supabase
    .from("businesses")
    .select(businessFields)
    .eq("id", membership.businessId)
    .maybeSingle();

  return baseBusiness ?? null;
});

export async function getOwnerBranches(businessId: string) {
  const supabase = createClient();

  const { data: branches } = await supabase
    .from("branches")
    .select("id, name, address, phone")
    .eq("business_id", businessId)
    .order("name");

  return branches ?? [];
}
