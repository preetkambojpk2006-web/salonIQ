"use client";

import { Suspense } from "react";
import { GettingStartedPanel } from "@/components/command-center/today/getting-started-panel";
import { NextAppointments } from "@/components/command-center/today/next-appointments";
import { OsHero } from "@/components/command-center/today/os-hero";
import { WalkinQueuePanel } from "@/components/command-center/today/walkin-queue-panel";
import { WelcomeBanner } from "@/components/command-center/welcome-banner";
import { BookingLinkCard } from "@/components/booking/BookingLinkCard";
import { CoachTeaser } from "@/components/coach/CoachTeaser";
import { LeaderboardCard } from "@/components/staff/LeaderboardCard";
import { SummaryGrid } from "@/components/command-center/today/summary-grid";
import type { StaffLeaderboardEntry } from "@/lib/staff/leaderboard";
import type { Appointment } from "@/lib/appointments/types";
import type {
  TodayMetrics,
  UpcomingAppointment,
} from "@/lib/dashboard/today-queries";
import { OnlinePendingRequests } from "@/components/appointments/online-pending-requests";
import { WalkinQrCard } from "@/components/walkin/WalkinQrCard";
import { LowStockAlerts } from "@/components/inventory/LowStockAlerts";
import type { InventoryProductWithBrand } from "@/lib/inventory/types";
import { useT } from "@/lib/i18n/LanguageContext";

type TodayViewProps = {
  metrics: TodayMetrics;
  upcoming: UpcomingAppointment[];
  onlinePending?: Appointment[];
  coachTeaserTitle?: string | null;
  staffLeaderboard?: StaffLeaderboardEntry[];
  showOwnerInsights?: boolean;
  businessId?: string | null;
  bookingSlug?: string | null;
  salonName?: string;
  dailyRevenueTarget?: number | null;
  lowStockProducts?: InventoryProductWithBrand[];
};

export function TodayView({
  metrics,
  upcoming,
  onlinePending = [],
  coachTeaserTitle = null,
  staffLeaderboard = [],
  showOwnerInsights = true,
  businessId = null,
  bookingSlug = null,
  salonName = "Your salon",
  dailyRevenueTarget = null,
  lowStockProducts = [],
}: TodayViewProps) {
  const { t } = useT();
  const isNewSalon =
    metrics.revenueToday === 0 &&
    metrics.bookingsToday === 0 &&
    upcoming.length === 0;

  return (
    <div className="view-stack">
      <WelcomeBanner />
      {showOwnerInsights && bookingSlug ? (
        <BookingLinkCard slug={bookingSlug} salonName={salonName} compact />
      ) : null}
      {showOwnerInsights && lowStockProducts.length > 0 ? (
        <LowStockAlerts lowStockProducts={lowStockProducts} />
      ) : null}
      <OsHero
        nextAppointment={upcoming[0] ?? null}
        revenueToday={metrics.revenueToday}
        dailyRevenueTarget={dailyRevenueTarget}
        showRevenue={showOwnerInsights}
      />
      <SummaryGrid metrics={metrics} showFinance={showOwnerInsights} />
      {showOwnerInsights ? (
        <CoachTeaser topInsightTitle={coachTeaserTitle} />
      ) : null}
      {showOwnerInsights ? <LeaderboardCard entries={staffLeaderboard} /> : null}

      {showOwnerInsights && onlinePending.length > 0 ? (
        <OnlinePendingRequests appointments={onlinePending} />
      ) : null}

      {showOwnerInsights && businessId ? (
        <Suspense
          fallback={
            <section
              style={{
                marginBottom: 8,
                padding: 16,
                borderRadius: 16,
                border: "1px solid #E0DAD0",
                background: "#EDE8DF",
                color: "#5C5C5C",
                fontSize: 14,
              }}
            >
              {t("today.queueLoading")}
            </section>
          }
        >
          <WalkinQueuePanel businessId={businessId} salonName={salonName} />
        </Suspense>
      ) : null}

      {showOwnerInsights && bookingSlug ? (
        <WalkinQrCard slug={bookingSlug} businessName={salonName} />
      ) : null}

      <div className="two-column">
        <NextAppointments appointments={upcoming} />
        {isNewSalon ? <GettingStartedPanel /> : null}
      </div>
    </div>
  );
}
