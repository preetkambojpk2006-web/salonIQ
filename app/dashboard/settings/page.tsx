import { SettingsView } from "@/components/settings/settings-view";
import { ensureBusinessBookingSlug } from "@/lib/booking/ensure-slug";
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
  const bookingSlug =
    business?.id && business.name
      ? (business.booking_slug ??
        (await ensureBusinessBookingSlug(business.id, business.name)))
      : null;

  return (
    <SettingsView
      initialName={business?.name ?? ""}
      initialPhone={business?.phone ?? ""}
      initialEmail={business?.email ?? ""}
      initialOpeningHours={openingHoursDisplay(
        business?.opening_hours as { display?: string } | null
      )}
      initialGoogleReviewLink={business?.google_review_link ?? ""}
      initialDailyRevenueTarget={
        business?.daily_revenue_target != null
          ? String(Number(business.daily_revenue_target))
          : ""
      }
      initialRewardEnabled={Boolean(business?.reward_enabled)}
      initialRewardType={
        business?.reward_type === "spend" ? "spend" : "visits"
      }
      initialRewardThreshold={
        business?.reward_threshold != null
          ? String(Number(business.reward_threshold))
          : "10"
      }
      initialRewardDescription={business?.reward_description ?? ""}
      bookingSlug={bookingSlug}
      salonName={business?.name ?? "Your salon"}
    />
  );
}
