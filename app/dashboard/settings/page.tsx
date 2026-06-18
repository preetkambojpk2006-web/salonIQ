import { AttendanceSettingsPanel } from "@/components/settings/attendance-settings-panel";
import { CommissionSettingsPanel } from "@/components/settings/commission-settings-panel";
import { GstSettingsPanel } from "@/components/settings/gst-settings-panel";
import { LanguageSettingsPanel } from "@/components/settings/language-settings-panel";
import { SettingsView } from "@/components/settings/settings-view";
import { LoyaltySettingsPanel } from "@/components/settings/loyalty-settings-panel";
import { ensureBusinessBookingSlug } from "@/lib/booking/ensure-slug";
import { getUserMembership, isOwnerOrAdmin } from "@/lib/auth/membership";
import { getBusinessRewardConfig } from "@/lib/customers/loyalty";
import { getCommissionConfig } from "@/lib/commission/actions";
import { getOwnerBusinessId } from "@/lib/customers/queries";
import { getOwnerBusiness } from "@/lib/onboarding/queries";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function openingHoursDisplay(
  openingHours: { display?: string } | string | null | undefined
): string {
  if (!openingHours) return "";
  if (typeof openingHours === "string") return openingHours;
  return openingHours.display ?? "";
}

export default async function SettingsPage() {
  const membership = await getUserMembership();

  if (!membership?.businessId) {
    redirect("/onboarding");
  }

  if (!isOwnerOrAdmin(membership.appRole)) {
    redirect("/dashboard");
  }

  const businessId = await getOwnerBusinessId();
  const [business, rewardConfig, commissionConfig] = await Promise.all([
    getOwnerBusiness(),
    businessId ? getBusinessRewardConfig(businessId) : Promise.resolve(null),
    getCommissionConfig(),
  ]);

  const bookingSlug =
    business?.id && business.name
      ? (business.booking_slug ??
        (await ensureBusinessBookingSlug(business.id, business.name)))
      : null;

  const businessWithGst = business as typeof business & {
    gst_enabled?: boolean;
    gst_number?: string | null;
    gst_rate?: number | null;
    gst_inclusive?: boolean;
  };

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
      languagePanel={<LanguageSettingsPanel />}
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
      gstPanel={
        <GstSettingsPanel
          initialGstEnabled={businessWithGst?.gst_enabled ?? false}
          initialGstNumber={businessWithGst?.gst_number ?? ""}
          initialGstRate={
            businessWithGst?.gst_rate != null
              ? String(Number(businessWithGst.gst_rate))
              : "18"
          }
          initialGstInclusive={businessWithGst?.gst_inclusive ?? false}
        />
      }
      commissionPanel={
        <CommissionSettingsPanel
          initialMode={commissionConfig.mode}
          initialSlabs={commissionConfig.slabs}
        />
      }
      bookingSlug={bookingSlug}
      salonName={business?.name ?? "Your salon"}
    />
  );
}
