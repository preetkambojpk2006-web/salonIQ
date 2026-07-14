import { TodayView } from "@/components/command-center/today/today-view";
import { BusinessPulseAsync } from "@/components/command-center/today/business-pulse-async";
import { BusinessPulseSkeleton } from "@/components/command-center/today/business-pulse-skeleton";
import { canManageFinance, getUserMembership } from "@/lib/auth/membership";
import { getCoachInsights, type Insight } from "@/lib/coach/insights";
import { listOnlinePendingAppointments } from "@/lib/appointments/queries";
import { getOwnerBusinessId } from "@/lib/customers/queries";
import { getTodayDashboardData } from "@/lib/dashboard/today-queries";
import { getLowStockProducts } from "@/lib/inventory/queries";
import type { InventoryProductWithBrand } from "@/lib/inventory/types";
import { getOwnerBusiness } from "@/lib/onboarding/queries";
import { getStaffLeaderboard } from "@/lib/staff/leaderboard";
import { listTodayWalkinQueue } from "@/lib/walkin/queries";
import { Suspense } from "react";

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
  const [data, businessId, membership, onlinePending] = await Promise.all([
    getTodayDashboardData(),
    getOwnerBusinessId(),
    getUserMembership(),
    listOnlinePendingAppointments(),
  ]);
  const appRole = membership?.appRole ?? "staff";

  const [insights, leaderboard, business, lowStockProducts, walkinQueue] =
    await Promise.all([
    businessId && appRole !== "staff"
      ? getCoachInsights(businessId)
      : Promise.resolve([]),
    businessId && appRole !== "staff"
      ? getStaffLeaderboard(businessId)
      : Promise.resolve([]),
    canManageFinance(appRole) ? getOwnerBusiness() : Promise.resolve(null),
    businessId && canManageFinance(appRole)
      ? getLowStockProducts(businessId)
      : Promise.resolve([] as InventoryProductWithBrand[]),
    businessId && canManageFinance(appRole)
      ? listTodayWalkinQueue(businessId)
      : Promise.resolve([]),
  ]);
  const topInsight = pickTopInsight(insights);

  return (
    <TodayView
      metrics={data.metrics}
      upcoming={data.upcoming}
      onlinePending={onlinePending}
      coachTeaserTitle={topInsight?.title ?? null}
      staffLeaderboard={leaderboard}
      showOwnerInsights={canManageFinance(appRole)}
      businessId={businessId}
      salonName={business?.name ?? "Your salon"}
      dailyRevenueTarget={(() => {
        const raw = business?.daily_revenue_target;
        if (raw == null) return null;
        const parsed = Number(raw);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
      })()}
      lowStockProducts={lowStockProducts}
      initialWalkinQueue={walkinQueue}
      analyticsPanel={
        canManageFinance(appRole) && businessId ? (
          <Suspense fallback={<BusinessPulseSkeleton />}>
            <BusinessPulseAsync businessId={businessId} />
          </Suspense>
        ) : null
      }
    />
  );
}
