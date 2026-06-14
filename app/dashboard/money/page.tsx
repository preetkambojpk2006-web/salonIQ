import { MoneyView } from "@/components/money/money-view";
import { StaffAdvances } from "@/components/money/StaffAdvances";
import { StaffPayouts } from "@/components/money/StaffPayouts";
import { canManageFinance, getUserMembership, isOwnerOrAdmin } from "@/lib/auth/membership";
import { getOwnerBusinessId } from "@/lib/customers/queries";
import {
  currentIstYearMonth,
  getBrandSpendSummary,
  getInventorySummary,
} from "@/lib/inventory/queries";
import type { BrandSpendSummary, InventorySummary } from "@/lib/inventory/types";
import { getDayBoundsIso } from "@/lib/payments/date-utils";
import {
  getCashUpiSplit,
  getMoneyDashboardStats,
} from "@/lib/payments/queries";
import type { CashUpiSplit } from "@/lib/payments/types";
import { listStaffMembers } from "@/lib/salon/queries";
import { listStaffAdvances } from "@/lib/staff/advances";
import { getStaffPayouts } from "@/lib/staff/payouts";
import type { StaffAdvance, StaffPayoutsSummary } from "@/lib/staff/types";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const EMPTY_SPLIT: CashUpiSplit = {
  cash: 0,
  upi: 0,
  total: 0,
  cashPercent: 0,
  upiPercent: 0,
};

const EMPTY_PAYOUTS: StaffPayoutsSummary = {
  rows: [],
  totalGrossUnpaid: 0,
  totalFineOutstanding: 0,
  totalAdvanceOutstanding: 0,
  totalNetPayable: 0,
  totalUnpaid: 0,
};

const EMPTY_INVENTORY_SUMMARY: InventorySummary = {
  total_stock_value: 0,
  month_purchase_total: 0,
  month_usage_total: 0,
  low_stock_count: 0,
};

export default async function MoneyPage() {
  const membership = await getUserMembership();

  if (!membership?.businessId) {
    redirect("/onboarding");
  }

  if (!isOwnerOrAdmin(membership.appRole)) {
    redirect("/dashboard");
  }

  const [stats, businessId] = await Promise.all([
    getMoneyDashboardStats(),
    getOwnerBusinessId(),
  ]);
  const appRole = membership.appRole;
  const showInventorySpend = canManageFinance(appRole);
  const { year, month } = currentIstYearMonth();

  const { startIso, endIsoExclusive } = getDayBoundsIso();
  const [cashUpiSplit, staffPayouts, staffAdvances, staffMembers, inventorySummary, brandSpend] =
    businessId
      ? await Promise.all([
          getCashUpiSplit(
            businessId,
            new Date(startIso),
            new Date(endIsoExclusive)
          ),
          getStaffPayouts(businessId),
          listStaffAdvances(businessId),
          listStaffMembers(businessId),
          showInventorySpend
            ? getInventorySummary(businessId, year, month)
            : Promise.resolve(EMPTY_INVENTORY_SUMMARY),
          showInventorySpend
            ? getBrandSpendSummary(businessId, year, month)
            : Promise.resolve([] as BrandSpendSummary[]),
        ])
      : [
          EMPTY_SPLIT,
          EMPTY_PAYOUTS,
          [] as StaffAdvance[],
          [],
          EMPTY_INVENTORY_SUMMARY,
          [] as BrandSpendSummary[],
        ];

  const activeStaff = staffMembers
    .filter((member) => member.is_active)
    .map((member) => ({ id: member.id, name: member.name }));

  return (
    <MoneyView
      stats={stats}
      cashUpiSplit={cashUpiSplit}
      showInventorySpend={showInventorySpend}
      inventorySummary={inventorySummary}
      brandSpend={brandSpend}
      staffPanels={
        <>
          <StaffAdvances advances={staffAdvances} staffMembers={activeStaff} />
          <StaffPayouts payouts={staffPayouts} />
        </>
      }
    />
  );
}
