import { TodayView } from "@/components/command-center/today/today-view";
import { getUserMembership } from "@/lib/auth/membership";
import { getCoachInsights, type Insight } from "@/lib/coach/insights";
import { getOwnerBusinessId } from "@/lib/customers/queries";
import { getTodayDashboardData } from "@/lib/dashboard/today-queries";
import { getStaffLeaderboard } from "@/lib/staff/leaderboard";

export const dynamic = "force-dynamic";

const SEVERITY_ORDER: Record<Insight["severity"], number> = {
  action: 0,
  watch: 1,
  good: 2,
};

function pickTopInsight(insights: Insight[]): Insight | null {
  if (insights.length === 0) return null;
  return [...insights].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  )[0];
}

export default async function DashboardPage() {
  const [data, businessId, membership] = await Promise.all([
    getTodayDashboardData(),
    getOwnerBusinessId(),
    getUserMembership(),
  ]);
  const appRole = membership?.appRole ?? "owner";

  const [insights, leaderboard] = await Promise.all([
    businessId && appRole !== "staff"
      ? getCoachInsights(businessId)
      : Promise.resolve([]),
    businessId && appRole !== "staff"
      ? getStaffLeaderboard(businessId)
      : Promise.resolve([]),
  ]);
  const topInsight = pickTopInsight(insights);

  return (
    <TodayView
      metrics={data.metrics}
      upcoming={data.upcoming}
      coachTeaserTitle={topInsight?.title ?? null}
      staffLeaderboard={leaderboard}
      appRole={appRole}
    />
  );
}
