import { createClient } from "@/lib/supabase/server";

export async function getOwnerBusiness() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, logo_url, phone, email, opening_hours, google_review_link")
    .eq("owner_id", user.id)
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
