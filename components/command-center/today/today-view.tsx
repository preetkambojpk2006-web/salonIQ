import { GettingStartedPanel } from "@/components/command-center/today/getting-started-panel";
import { NextAppointments } from "@/components/command-center/today/next-appointments";
import { OsHero } from "@/components/command-center/today/os-hero";
import { WelcomeBanner } from "@/components/command-center/welcome-banner";
import { CoachTeaser } from "@/components/coach/CoachTeaser";
import { LeaderboardCard } from "@/components/staff/LeaderboardCard";
import { SummaryGrid } from "@/components/command-center/today/summary-grid";
import type { StaffLeaderboardEntry } from "@/lib/staff/leaderboard";
import type { AppRole } from "@/lib/auth/membership";
import { canManageFinance } from "@/lib/auth/membership";
import type {
  TodayMetrics,
  UpcomingAppointment,
} from "@/lib/dashboard/today-queries";

type TodayViewProps = {
  metrics: TodayMetrics;
  upcoming: UpcomingAppointment[];
  coachTeaserTitle?: string | null;
  staffLeaderboard?: StaffLeaderboardEntry[];
  appRole?: AppRole;
};

export function TodayView({
  metrics,
  upcoming,
  coachTeaserTitle = null,
  staffLeaderboard = [],
  appRole = "owner",
}: TodayViewProps) {
  const showOwnerInsights = canManageFinance(appRole);
  const isNewSalon =
    metrics.revenueToday === 0 &&
    metrics.bookingsToday === 0 &&
    upcoming.length === 0;

  return (
    <div className="view-stack">
      <WelcomeBanner />
      <OsHero
        nextAppointment={upcoming[0] ?? null}
        revenueToday={metrics.revenueToday}
        showRevenue={showOwnerInsights}
      />
      <SummaryGrid metrics={metrics} appRole={appRole} />
      {showOwnerInsights ? (
        <CoachTeaser topInsightTitle={coachTeaserTitle} />
      ) : null}
      {showOwnerInsights ? <LeaderboardCard entries={staffLeaderboard} /> : null}

      <div className="two-column">
        <NextAppointments appointments={upcoming} />
        {isNewSalon ? <GettingStartedPanel /> : null}
      </div>
    </div>
  );
}
