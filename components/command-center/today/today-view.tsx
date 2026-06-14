"use client";

import { GettingStartedPanel } from "@/components/command-center/today/getting-started-panel";
import { NextAppointments } from "@/components/command-center/today/next-appointments";
import { OsHero } from "@/components/command-center/today/os-hero";
import { WalkinQueuePanelClient } from "@/components/command-center/today/walkin-queue-panel-client";
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
import { LowStockAlerts } from "@/components/inventory/LowStockAlerts";
import type { InventoryProductWithBrand } from "@/lib/inventory/types";
import type { WalkinQueueRow } from "@/lib/walkin/types";

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
  initialWalkinQueue?: WalkinQueueRow[];
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
  initialWalkinQueue = [],
}: TodayViewProps) {
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
      <OsHero
        nextAppointment={upcoming[0] ?? null}
        revenueToday={metrics.revenueToday}
        dailyRevenueTarget={dailyRevenueTarget}
        showRevenue={showOwnerInsights}
      />
      <div className="two-column">
        <NextAppointments appointments={upcoming} />
        {isNewSalon ? <GettingStartedPanel /> : null}
      </div>
      <SummaryGrid metrics={metrics} showFinance={showOwnerInsights} />
      {showOwnerInsights && businessId ? (
        <WalkinQueuePanelClient
          businessId={businessId}
          salonName={salonName}
          initialQueue={initialWalkinQueue}
        />
      ) : null}
      {showOwnerInsights && onlinePending.length > 0 ? (
        <OnlinePendingRequests appointments={onlinePending} />
      ) : null}
      {showOwnerInsights ? (
        <CoachTeaser topInsightTitle={coachTeaserTitle} />
      ) : null}
      {showOwnerInsights ? <LeaderboardCard entries={staffLeaderboard} /> : null}
      {showOwnerInsights && lowStockProducts.length > 0 ? (
        <LowStockAlerts lowStockProducts={lowStockProducts} />
      ) : null}
    </div>
  );
}
