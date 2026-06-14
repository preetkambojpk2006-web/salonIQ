import { BranchesView } from "@/components/branches/branches-view";
import { getOwnerBranches, getOwnerBusiness } from "@/lib/onboarding/queries";

export const dynamic = "force-dynamic";

export default async function BranchesPage() {
  const business = await getOwnerBusiness();
  const branches = business?.id ? await getOwnerBranches(business.id) : [];

  return <BranchesView business={business} branches={branches} />;
}
