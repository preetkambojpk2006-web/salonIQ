import { GettingStartedPanel } from "@/components/command-center/today/getting-started-panel";
import { NextAppointments } from "@/components/command-center/today/next-appointments";
import { OsHero } from "@/components/command-center/today/os-hero";
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

type TodayViewProps = {
  metrics: TodayMetrics;
  upcoming: UpcomingAppointment[];
  onlinePending?: Appointment[];
  coachTeaserTitle?: string | null;
  staffLeaderboard?: StaffLeaderboardEntry[];
  appRole?: AppRole;
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

      <div className="two-column">
        <NextAppointments appointments={upcoming} />
        {isNewSalon ? <GettingStartedPanel /> : null}
      </div>
    </div>
  );
}
