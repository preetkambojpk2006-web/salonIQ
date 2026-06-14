import { TodayView } from "@/components/command-center/today/today-view";
import { ensureBusinessBookingSlug } from "@/lib/booking/ensure-slug";
import { canManageFinance, getUserMembership } from "@/lib/auth/membership";
import { getCoachInsights, type Insight } from "@/lib/coach/insights";
import { listOnlinePendingAppointments } from "@/lib/appointments/queries";
import { getOwnerBusinessId } from "@/lib/customers/queries";
import { getTodayDashboardData } from "@/lib/dashboard/today-queries";
import { getLowStockProducts } from "@/lib/inventory/queries";
import type { InventoryProductWithBrand } from "@/lib/inventory/types";
import { getOwnerBusiness } from "@/lib/onboarding/queries";
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
  const [data, businessId, membership, onlinePending] = await Promise.all([
    getTodayDashboardData(),
    getOwnerBusinessId(),
    getUserMembership(),
    listOnlinePendingAppointments(),
  ]);
  const appRole = membership?.appRole ?? "owner";

  const [insights, leaderboard, business, lowStockProducts] = await Promise.all([
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
  ]);
  const topInsight = pickTopInsight(insights);

  const bookingSlug =
    business?.id && business.name
      ? (business.booking_slug ??
        (await ensureBusinessBookingSlug(business.id, business.name)))
      : null;

  return (
    <TodayView
      metrics={data.metrics}
      upcoming={data.upcoming}
      onlinePending={onlinePending}
      coachTeaserTitle={topInsight?.title ?? null}
      staffLeaderboard={leaderboard}
      appRole={appRole}
      businessId={businessId}
      bookingSlug={bookingSlug}
      salonName={business?.name ?? "Your salon"}
      dailyRevenueTarget={
        business?.daily_revenue_target != null
          ? Number(business.daily_revenue_target)
          : null
      }
      lowStockProducts={lowStockProducts}
    />
  );
}
