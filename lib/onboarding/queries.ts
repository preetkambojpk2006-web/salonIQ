import { getUserMembership } from "@/lib/auth/membership";
import { createClient } from "@/lib/supabase/server";

export async function getOwnerBusiness() {
  const supabase = createClient();
  const membership = await getUserMembership();

  if (!membership) return null;

  const { data: business } = await supabase
    .from("businesses")
    .select(
      "id, name, logo_url, phone, email, opening_hours, google_review_link, booking_slug, daily_revenue_target, late_fine_amount"
    )
    .eq("id", membership.businessId)
    .maybeSingle();

  return business;
}

export async function getOwnerBranches(businessId: string) {
  const supabase = createClient();

  const { data: branches } = await supabase
    .from("branches")
    .select("id, name, address, phone")
    .eq("business_id", businessId)
    .order("name");

  return branches ?? [];
}
