import { cache } from "react";
import { getCachedAuthUser } from "@/lib/auth/cached-server";
import { createClient } from "@/lib/supabase/server";
import type { AppRole, UserMembership } from "@/lib/auth/types";

export type { AppRole, UserMembership } from "@/lib/auth/types";

function normalizeRole(value: string | null | undefined): AppRole | null {
  if (value === "owner" || value === "admin" || value === "staff") {
    return value;
  }
  return null;
}

export const getUserMembership = cache(async (): Promise<UserMembership | null> => {
  const supabase = createClient();
  const user = await getCachedAuthUser();

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
});

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
