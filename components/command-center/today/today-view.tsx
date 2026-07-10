"use client";

import { GettingStartedPanel } from "@/components/command-center/today/getting-started-panel";
import { NextAppointments } from "@/components/command-center/today/next-appointments";
import { OsHero } from "@/components/command-center/today/os-hero";
import { WalkinQueuePanelClient } from "@/components/command-center/today/walkin-queue-panel-client";
import { WelcomeBanner } from "@/components/command-center/welcome-banner";
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
import { useBusinessRealtimeRefresh } from "@/lib/supabase/use-business-realtime";
import { formatTime12h } from "@/lib/format/time";

type TodayViewProps = {
  metrics: TodayMetrics;
  upcoming: UpcomingAppointment[];
  onlinePending?: Appointment[];
  coachTeaserTitle?: string | null;
  staffLeaderboard?: StaffLeaderboardEntry[];
  showOwnerInsights?: boolean;
  businessId?: string | null;
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
  salonName = "Your salon",
  dailyRevenueTarget = null,
  lowStockProducts = [],
  initialWalkinQueue = [],
}: TodayViewProps) {
  useBusinessRealtimeRefresh({
    businessId,
    tableSet: "today",
    enabled: Boolean(businessId),
  });

  const hasBookingsToday = metrics.bookingsToday > 0;
  const hasUpcoming = upcoming.length > 0;
  const hasOnlinePending = onlinePending.length > 0;
  const hasActivity = hasBookingsToday || hasUpcoming || hasOnlinePending;

  const heroNext =
    upcoming[0] ??
    (onlinePending[0]
      ? {
          id: onlinePending[0].id,
          time: formatTime12h(onlinePending[0].start_time),
          customer: onlinePending[0].customer_name ?? "Customer",
          service: onlinePending[0].service_name ?? "Service",
          staff: onlinePending[0].staff_name ?? "Team",
          status: onlinePending[0].status,
          payment_status: onlinePending[0].payment_status ?? "unpaid",
        }
      : null);

  const isNewSalon = !hasActivity && metrics.revenueToday === 0;

  return (
    <div className="view-stack">
      <WelcomeBanner hasActivity={hasActivity} />
      <SummaryGrid metrics={metrics} showFinance={showOwnerInsights} />
      <OsHero
        nextAppointment={heroNext}
        bookingsToday={metrics.bookingsToday}
        revenueToday={metrics.revenueToday}
        dailyRevenueTarget={dailyRevenueTarget}
        showRevenue={showOwnerInsights}
      />
      {showOwnerInsights && onlinePending.length > 0 ? (
        <OnlinePendingRequests appointments={onlinePending} />
      ) : null}
      <div className="two-column">
        <NextAppointments appointments={upcoming} />
        {isNewSalon ? <GettingStartedPanel /> : null}
      </div>
      {showOwnerInsights && businessId ? (
        <WalkinQueuePanelClient
          businessId={businessId}
          salonName={salonName}
          initialQueue={initialWalkinQueue}
        />
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
