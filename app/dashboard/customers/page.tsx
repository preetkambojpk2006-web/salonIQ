import { Suspense } from "react";
import { CustomersView } from "@/components/command-center/customers-view";
import { getBusinessRewardConfig } from "@/lib/customers/loyalty";
import { listCustomers, getOwnerBusinessId } from "@/lib/customers/queries";
import type { BusinessRewardConfig } from "@/lib/customers/loyalty-types";
import { getOwnerBusiness } from "@/lib/onboarding/queries";

export const dynamic = "force-dynamic";

const DISABLED_REWARD_CONFIG: BusinessRewardConfig = {
  reward_enabled: false,
  reward_type: "visits",
  reward_threshold: 10,
  reward_description: null,
};

type CustomersPageProps = {
  searchParams: { q?: string; error?: string; added?: string };
};

export default async function CustomersPage({
  searchParams,
}: CustomersPageProps) {
  const businessId = await getOwnerBusinessId();
  const [customers, rewardConfig, business] = await Promise.all([
    listCustomers(searchParams.q),
    businessId
      ? getBusinessRewardConfig(businessId)
      : Promise.resolve(null),
    getOwnerBusiness(),
  ]);

  return (
    <Suspense fallback={null}>
      <CustomersView
        initialCustomers={customers}
        initialQuery={searchParams.q ?? ""}
        error={searchParams.error}
        showAddedToast={searchParams.added === "1"}
        rewardConfig={rewardConfig ?? DISABLED_REWARD_CONFIG}
        salonName={business?.name ?? "Your salon"}
      />
    </Suspense>
  );
}
