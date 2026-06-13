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
import type { AppRole } from "@/lib/auth/membership";
import { canManageFinance } from "@/lib/auth/membership";
import type { Appointment } from "@/lib/appointments/types";
import type {
  TodayMetrics,
  UpcomingAppointment,
} from "@/lib/dashboard/today-queries";
import { OnlinePendingRequests } from "@/components/appointments/online-pending-requests";
import { WalkinQrCard } from "@/components/walkin/WalkinQrCard";

type TodayViewProps = {
  metrics: TodayMetrics;
  upcoming: UpcomingAppointment[];
  onlinePending?: Appointment[];
  coachTeaserTitle?: string | null;
  staffLeaderboard?: StaffLeaderboardEntry[];
  appRole?: AppRole;
  businessId?: string | null;
  bookingSlug?: string | null;
  salonName?: string;
  dailyRevenueTarget?: number | null;
};

export function TodayView({
  metrics,
  upcoming,
  onlinePending = [],
  coachTeaserTitle = null,
  staffLeaderboard = [],
  appRole = "owner",
  businessId = null,
  bookingSlug = null,
  salonName = "Your salon",
  dailyRevenueTarget = null,
}: TodayViewProps) {
  const showOwnerInsights = canManageFinance(appRole);
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
      <SummaryGrid metrics={metrics} appRole={appRole} />
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
              Walk-in queue load ho rahi hai…
            </section>
          }
        >
          <WalkinQueuePanel businessId={businessId} />
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
