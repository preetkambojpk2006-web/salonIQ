import { cache } from "react";
import type { AppRole } from "@/lib/auth/membership";
import { getUserMembership } from "@/lib/auth/membership";
import { getCachedAuthUser } from "@/lib/auth/cached-server";
import {
  BRANCH_COOKIE_NAME,
  resolveSelectedBranchId,
} from "@/lib/command-center/branch-cookie";
import { getOwnerBranches, getOwnerBusiness } from "@/lib/onboarding/queries";
import { getNamasteGreeting, getFirstName } from "@/lib/dashboard/greeting";
import { cookies } from "next/headers";

export type WorkspaceContext = {
  ownerName: string;
  ownerEmail: string | null;
  businessName: string;
  branches: { id: string; name: string }[];
  selectedBranchId: string | null;
  greeting: string;
  appRole: AppRole;
};

export const getWorkspaceContext = cache(async (): Promise<WorkspaceContext> => {
  const user = await getCachedAuthUser();
  const membership = await getUserMembership();

  const [business, branches] = await Promise.all([
    getOwnerBusiness(),
    membership?.businessId
      ? getOwnerBranches(membership.businessId)
      : Promise.resolve([]),
  ]);

  const meta = user?.user_metadata as { full_name?: string; name?: string } | undefined;
  const displayName = meta?.full_name ?? meta?.name ?? null;
  const ownerName = getFirstName(user?.email, displayName);
  const branchList = branches.map((b) => ({ id: b.id, name: b.name }));
  const branchCookie = cookies().get(BRANCH_COOKIE_NAME)?.value;

  return {
    ownerName,
    ownerEmail: user?.email ?? null,
    businessName: business?.name ?? "Your salon",
    branches: branchList,
    selectedBranchId: resolveSelectedBranchId(branchList, branchCookie),
    greeting: getNamasteGreeting(user?.email, displayName),
    appRole: membership?.appRole ?? "staff",
  };
});
