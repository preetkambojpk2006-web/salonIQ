import { SettingsView } from "@/components/settings/settings-view";
import { getOwnerBusiness } from "@/lib/onboarding/queries";

export const dynamic = "force-dynamic";

function openingHoursDisplay(
  openingHours: { display?: string } | string | null | undefined
): string {
  if (!openingHours) return "";
  if (typeof openingHours === "string") return openingHours;
  return openingHours.display ?? "";
}

export default async function SettingsPage() {
  const business = await getOwnerBusiness();

  return (
    <SettingsView
      initialName={business?.name ?? ""}
      initialPhone={business?.phone ?? ""}
      initialEmail={business?.email ?? ""}
      initialOpeningHours={openingHoursDisplay(
        business?.opening_hours as { display?: string } | null
      )}
      initialGoogleReviewLink={business?.google_review_link ?? ""}
    />
  );
}
