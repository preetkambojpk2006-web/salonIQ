import { AttendanceSettingsPanel } from "@/components/settings/attendance-settings-panel";
import { LanguageSettingsPanel } from "@/components/settings/language-settings-panel";
import { SettingsView } from "@/components/settings/settings-view";
import { LoyaltySettingsPanel } from "@/components/settings/loyalty-settings-panel";
import { ensureBusinessBookingSlug } from "@/lib/booking/ensure-slug";
import { getBusinessRewardConfig } from "@/lib/customers/loyalty";
import { getOwnerBusinessId } from "@/lib/customers/queries";
import { getLocale } from "@/lib/i18n";
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
  const businessId = await getOwnerBusinessId();
  const [business, rewardConfig] = await Promise.all([
    getOwnerBusiness(),
    businessId ? getBusinessRewardConfig(businessId) : Promise.resolve(null),
  ]);

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
      languagePanel={
        <LanguageSettingsPanel
          initialLocale={getLocale(
            (business as { ui_language?: string | null } | null)?.ui_language
          )}
        />
      }
      attendancePanel={
        <AttendanceSettingsPanel
          initialLateFineAmount={
            business?.late_fine_amount != null
              ? String(Number(business.late_fine_amount))
              : "100"
          }
        />
      }
      loyaltyPanel={
        <LoyaltySettingsPanel
          initialRewardEnabled={rewardConfig?.reward_enabled ?? false}
          initialRewardType={rewardConfig?.reward_type ?? "visits"}
          initialRewardThreshold={
            rewardConfig?.reward_threshold != null
              ? String(rewardConfig.reward_threshold)
              : "10"
          }
          initialRewardDescription={rewardConfig?.reward_description ?? ""}
        />
      }
      bookingSlug={bookingSlug}
      salonName={business?.name ?? "Your salon"}
    />
  );
}
