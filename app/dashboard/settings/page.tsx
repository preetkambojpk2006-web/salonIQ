import { SettingsView } from "@/components/settings/settings-view";
import { getOwnerBusiness } from "@/lib/onboarding/queries";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const business = await getOwnerBusiness();

  return (
    <SettingsView
      salonName={business?.name ?? "Your salon"}
      initialGoogleReviewLink={business?.google_review_link ?? null}
    />
  );
}
