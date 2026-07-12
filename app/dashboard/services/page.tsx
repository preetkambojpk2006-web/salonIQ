import { SalonSetupView } from "@/components/salon/salon-setup-view";
import { ServicesOnboardingPrompt } from "@/components/services/services-onboarding-prompt";
import { ensureBusinessBookingSlug } from "@/lib/booking/ensure-slug";
import { getOwnerBusiness } from "@/lib/onboarding/queries";
import {
  listBranchOptions,
  listRecipeProductOptions,
  listServiceRecipes,
  listServices,
  listStaffMembers,
  listStaffServicePrices,
} from "@/lib/salon/queries";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const business = await getOwnerBusiness();

  if (!business?.id) {
    return <ServicesOnboardingPrompt />;
  }

  const bookingSlug =
    business.booking_slug ??
    (await ensureBusinessBookingSlug(business.id, business.name));

  const [
    services,
    staff,
    branches,
    staffServicePrices,
    serviceRecipes,
    recipeProducts,
  ] = await Promise.all([
    listServices(business.id),
    listStaffMembers(business.id),
    listBranchOptions(business.id),
    listStaffServicePrices(business.id),
    listServiceRecipes(business.id),
    listRecipeProductOptions(business.id),
  ]);

  return (
    <SalonSetupView
      services={services}
      staff={staff}
      branches={branches}
      staffServicePrices={staffServicePrices}
      serviceRecipes={serviceRecipes}
      recipeProducts={recipeProducts}
      bookingSlug={bookingSlug}
    />
  );
}
