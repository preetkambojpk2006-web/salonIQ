"use server";

import { getAuthenticatedLandingPath } from "@/lib/auth/business-approval";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/** Re-check approval; redirect to dashboard (or onboarding) when no longer pending. */
export async function refreshApprovalStatus() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  redirect(await getAuthenticatedLandingPath(supabase));
}
