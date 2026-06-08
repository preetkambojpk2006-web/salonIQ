import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppRole } from "@/lib/auth/membership";

export async function resolveAppRole(
  supabase: SupabaseClient,
  userId: string
): Promise<AppRole | null> {
  const { data: ownedBusiness } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();

  if (ownedBusiness?.id) {
    return "owner";
  }

  const { data: membership } = await supabase
    .from("business_members")
    .select("app_role")
    .eq("user_id", userId)
    .maybeSingle();

  if (membership?.app_role === "admin") return "admin";
  if (membership?.app_role === "staff") return "staff";

  return null;
}
