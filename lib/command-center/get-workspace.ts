import type { AppRole } from "@/lib/auth/membership";
import { getUserMembership } from "@/lib/auth/membership";
import { getOwnerBranches, getOwnerBusiness } from "@/lib/onboarding/queries";
import { createClient } from "@/lib/supabase/server";
import { getNamasteGreeting, getFirstName } from "@/lib/dashboard/greeting";

export type WorkspaceContext = {
  ownerName: string;
  ownerEmail: string | null;
  businessName: string;
  branches: { id: string; name: string }[];
  greeting: string;
  appRole: AppRole;
};

export async function getWorkspaceContext(): Promise<WorkspaceContext> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const membership = await getUserMembership();
  const business = await getOwnerBusiness();
  const branches = business
    ? await getOwnerBranches(business.id)
    : [];

  const meta = user?.user_metadata as { full_name?: string; name?: string } | undefined;
  const displayName = meta?.full_name ?? meta?.name ?? null;
  const ownerName = getFirstName(user?.email, displayName);

  return {
    ownerName,
    ownerEmail: user?.email ?? null,
    businessName: business?.name ?? "Your salon",
    branches: branches.map((b) => ({ id: b.id, name: b.name })),
    greeting: getNamasteGreeting(user?.email, displayName),
    appRole: membership?.appRole ?? "owner",
  };
}
