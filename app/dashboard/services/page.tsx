import { SalonSetupView } from "@/components/salon/salon-setup-view";
import { ensureBusinessBookingSlug } from "@/lib/booking/ensure-slug";
import { getOwnerBusiness } from "@/lib/onboarding/queries";
import {
  listBranchOptions,
  listServices,
  listStaffMembers,
} from "@/lib/salon/queries";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const business = await getOwnerBusiness();

  if (!business?.id) {
    return (
      <div className="view-stack">
        <section className="panel">
          <p className="text-body">
            Pehle onboarding complete karein — phir services aur staff yahan manage kar
            sakte ho.
          </p>
        </section>
      </div>
    );
  }

  const bookingSlug =
    business.booking_slug ??
    (await ensureBusinessBookingSlug(business.id, business.name));

  const [services, staff, branches] = await Promise.all([
    listServices(business.id),
    listStaffMembers(business.id),
    listBranchOptions(business.id),
  ]);

  return (
    <SalonSetupView
      services={services}
      staff={staff}
      branches={branches}
      bookingSlug={bookingSlug}
    />
  );
}
