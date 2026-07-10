import type { SupabaseClient } from "@supabase/supabase-js";

export const BRANCH_LIMIT_ERROR_CODE = "branch_limit_reached";

const DEFAULT_MAX_BRANCHES = 2;

export type BranchLimitCheckResult =
  | { ok: true }
  | { ok: false; errorCode: typeof BRANCH_LIMIT_ERROR_CODE };

export async function checkBranchCreationAllowed(
  supabase: SupabaseClient,
  businessId: string
): Promise<BranchLimitCheckResult> {
  const [{ count, error: countError }, { data: business, error: businessError }] =
    await Promise.all([
      supabase
        .from("branches")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId),
      supabase
        .from("businesses")
        .select("max_branches")
        .eq("id", businessId)
        .maybeSingle(),
    ]);

  if (countError || businessError) {
    console.error(
      "checkBranchCreationAllowed:",
      countError?.message ?? businessError?.message
    );
    return { ok: false, errorCode: BRANCH_LIMIT_ERROR_CODE };
  }

  const maxBranches = Number(business?.max_branches ?? DEFAULT_MAX_BRANCHES);
  const currentCount = count ?? 0;

  if (currentCount >= maxBranches) {
    return { ok: false, errorCode: BRANCH_LIMIT_ERROR_CODE };
  }

  return { ok: true };
}
