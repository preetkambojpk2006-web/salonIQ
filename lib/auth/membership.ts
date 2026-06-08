import { createClient } from "@/lib/supabase/server";

export type AppRole = "owner" | "admin" | "staff";

export type UserMembership = {
  businessId: string;
  appRole: AppRole;
};

function normalizeRole(value: string | null | undefined): AppRole | null {
  if (value === "owner" || value === "admin" || value === "staff") {
    return value;
  }
  return null;
}

export async function getUserMembership(): Promise<UserMembership | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: ownedBusiness } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (ownedBusiness?.id) {
    return { businessId: ownedBusiness.id, appRole: "owner" };
  }

  const { data: membership } = await supabase
    .from("business_members")
    .select("business_id, app_role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership?.business_id) {
    return null;
  }

  const appRole = normalizeRole(membership.app_role) ?? "staff";
  return { businessId: membership.business_id, appRole };
}

export async function getUserBusinessId(): Promise<string | null> {
  const membership = await getUserMembership();
  return membership?.businessId ?? null;
}

export function canManageFinance(role: AppRole): boolean {
  return role === "owner" || role === "admin";
}

export function isOwnerOrAdmin(role: AppRole): boolean {
  return role === "owner" || role === "admin";
}
