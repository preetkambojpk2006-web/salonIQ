import { AuditLogPanel } from "@/components/settings/audit-log-panel";
import { AttendanceSettingsPanel } from "@/components/settings/attendance-settings-panel";
import { CommissionSettingsPanel } from "@/components/settings/commission-settings-panel";
import { GstSettingsPanel } from "@/components/settings/gst-settings-panel";
import { LanguageSettingsPanel } from "@/components/settings/language-settings-panel";
import { OnlineBookingSettingsPanel } from "@/components/settings/online-booking-settings-panel";
import { ReviewsSocialSettingsPanel } from "@/components/settings/reviews-social-settings-panel";
import { SettingsView } from "@/components/settings/settings-view";
import { LoyaltySettingsPanel } from "@/components/settings/loyalty-settings-panel";
import { getAuditLogs } from "@/lib/audit/queries";
import { ensureBusinessBookingSlug } from "@/lib/booking/ensure-slug";
import { getUserMembership, isOwnerOrAdmin } from "@/lib/auth/membership";
import { getBusinessRewardConfig } from "@/lib/customers/loyalty";
import { getCommissionConfig } from "@/lib/commission/actions";
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

  const businessId = membership.businessId;
  const [business, rewardConfig, commissionConfig, auditLogs] = await Promise.all([
    getOwnerBusiness(),
    getBusinessRewardConfig(businessId),
    getCommissionConfig(),
    getAuditLogs(businessId),
  ]);

  const bookingSlug =
    business?.id && business.name
      ? (business.booking_slug ??
        (await ensureBusinessBookingSlug(business.id, business.name)))
      : null;

  const businessWithExtras = business as typeof business & {
    gst_enabled?: boolean;
    gst_number?: string | null;
    gst_rate?: number | null;
    gst_inclusive?: boolean;
    online_booking_enabled?: boolean;
    review_prompt_enabled?: boolean;
    review_filter_enabled?: boolean;
    google_review_url?: string | null;
    instagram_prompt_enabled?: boolean;
    instagram_url?: string | null;
  };

  return (
    <SettingsView
      initialName={business?.name ?? ""}
      initialPhone={business?.phone ?? ""}
      initialEmail={business?.email ?? ""}
      initialOpeningHours={openingHoursDisplay(
        business?.opening_hours as { display?: string } | null
      )}
      initialDailyRevenueTarget={
        business?.daily_revenue_target != null
          ? String(Number(business.daily_revenue_target))
          : ""
      }
      languagePanel={<LanguageSettingsPanel />}
      auditLogPanel={<AuditLogPanel entries={auditLogs} />}
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
          initialGstEnabled={businessWithExtras?.gst_enabled ?? false}
          initialGstNumber={businessWithExtras?.gst_number ?? ""}
          initialGstRate={
            businessWithExtras?.gst_rate != null
              ? String(Number(businessWithExtras.gst_rate))
              : "18"
          }
          initialGstInclusive={businessWithExtras?.gst_inclusive ?? false}
        />
      }
      commissionPanel={
        <CommissionSettingsPanel
          initialMode={commissionConfig.mode}
          initialSlabs={commissionConfig.slabs}
        />
      }
      bookingSlug={bookingSlug}
      onlineBookingPanel={
        <OnlineBookingSettingsPanel
          initialEnabled={businessWithExtras?.online_booking_enabled ?? true}
        />
      }
      reviewsSocialPanel={
        <ReviewsSocialSettingsPanel
          initialReviewPromptEnabled={
            businessWithExtras?.review_prompt_enabled ?? false
          }
          initialReviewFilterEnabled={
            businessWithExtras?.review_filter_enabled !== false
          }
          initialGoogleReviewUrl={
            businessWithExtras?.google_review_url ??
            business?.google_review_link ??
            ""
          }
          initialInstagramPromptEnabled={
            businessWithExtras?.instagram_prompt_enabled ?? false
          }
          initialInstagramUrl={businessWithExtras?.instagram_url ?? ""}
        />
      }
      salonName={business?.name ?? "Your salon"}
    />
  );
}
