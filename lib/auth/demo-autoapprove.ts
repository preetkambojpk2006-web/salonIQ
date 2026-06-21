import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Demo-only auto-approval after onboarding completes.
 *
 * Set NEXT_PUBLIC_DEMO_AUTOAPPROVE=true in local/staging to skip /pending during
 * demos. Default off in production — real signups still require manual approval.
 * Requires SUPABASE_SERVICE_ROLE_KEY on the server (service role bypasses the
 * guard_business_approval trigger for this one-shot approve write).
 */
export function isDemoAutoApproveEnabled(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_AUTOAPPROVE === "true";
}

export async function maybeAutoApproveForDemo(
  businessId: string
): Promise<void> {
  if (!isDemoAutoApproveEnabled()) {
    return;
  }

  const admin = createAdminClient();
  if (!admin) {
    console.warn(
      "NEXT_PUBLIC_DEMO_AUTOAPPROVE is enabled but SUPABASE_SERVICE_ROLE_KEY is missing"
    );
    return;
  }

  const { error } = await admin
    .from("businesses")
    .update({
      is_approved: true,
      approved_at: new Date().toISOString(),
    })
    .eq("id", businessId)
    .eq("is_approved", false);

  if (error) {
    console.error("demo auto-approve:", error.message);
  }
}
