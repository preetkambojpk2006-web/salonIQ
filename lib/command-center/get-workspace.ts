import { getOwnerBranches, getOwnerBusiness } from "@/lib/onboarding/queries";
import { createClient } from "@/lib/supabase/server";
import { getGreeting } from "@/lib/dashboard/greeting";

export type WorkspaceContext = {
  ownerName: string;
  ownerEmail: string | null;
  businessName: string;
  branches: { id: string; name: string }[];
  greeting: string;
};

function nameFromEmail(email: string | undefined): string {
  if (!email) return "Owner";
  const local = email.split("@")[0] ?? "owner";
  return local
    .split(/[._-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function getWorkspaceContext(): Promise<WorkspaceContext> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const business = await getOwnerBusiness();
  const branches = business
    ? await getOwnerBranches(business.id)
    : [];

  const meta = user?.user_metadata as { full_name?: string; name?: string } | undefined;
  const ownerName =
    meta?.full_name ??
    meta?.name ??
    nameFromEmail(user?.email) ??
    "Priya";

  return {
    ownerName,
    ownerEmail: user?.email ?? null,
    businessName: business?.name ?? "Glow Studio Salon",
    branches:
      branches.length > 0
        ? branches.map((b) => ({ id: b.id, name: b.name }))
        : [
            { id: "mock-koramangala", name: "Koramangala" },
            { id: "mock-indiranagar", name: "Indiranagar" },
          ],
    greeting: getGreeting(),
  };
}
