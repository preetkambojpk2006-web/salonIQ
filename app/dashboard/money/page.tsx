import { MissingCommissionRetries } from "@/components/money/MissingCommissionRetries";
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
import {
  getMoneyRangeBounds,
  normalizeMoneyRange,
  SALON_TIMEZONE,
} from "@/lib/payments/date-utils";
import { getOwnerBusiness } from "@/lib/onboarding/queries";
import {
  getCashUpiSplit,
  getMoneyDashboardStats,
  listPaymentsInRange,
} from "@/lib/payments/queries";
import type { CashUpiSplit, PaymentExportRow } from "@/lib/payments/types";
import { listStaffMembers } from "@/lib/salon/queries";
import { listStaffAdvances } from "@/lib/staff/advances";
import { getStaffPayouts } from "@/lib/staff/payouts";
import { getPaidAppointmentsMissingCommission } from "@/lib/staff/missing-commission";
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

type MoneyPageProps = {
  searchParams?: { range?: string };
};

export default async function MoneyPage({ searchParams }: MoneyPageProps) {
  const membership = await getUserMembership();

  if (!membership?.businessId) {
    redirect("/onboarding");
  }

  if (!isOwnerOrAdmin(membership.appRole)) {
    redirect("/dashboard");
  }

  const range = normalizeMoneyRange(searchParams?.range);
  const { startIso, endIsoExclusive } = getMoneyRangeBounds(range);

  const [stats, businessId, business] = await Promise.all([
    getMoneyDashboardStats(startIso, endIsoExclusive),
    getOwnerBusinessId(),
    getOwnerBusiness(),
  ]);
  const appRole = membership.appRole;
  const salonName = business?.name ?? "";
  const monthLabel = new Date().toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: SALON_TIMEZONE,
  });
  const showInventorySpend = canManageFinance(appRole);
  // TODO: Inventory spend is still month-scoped (current IST month). Range-aware
  // inventory reporting can reuse startIso/endIsoExclusive in a follow-up.
  const { year, month } = currentIstYearMonth();

  const [cashUpiSplit, staffPayouts, staffAdvances, staffMembers, inventorySummary, brandSpend, missingCommissions, paymentsForExport] =
    businessId
      ? await Promise.all([
          getCashUpiSplit(
            businessId,
            new Date(startIso),
            new Date(endIsoExclusive)
          ),
          getStaffPayouts(businessId, startIso, endIsoExclusive),
          listStaffAdvances(businessId),
          listStaffMembers(businessId),
          showInventorySpend
            ? getInventorySummary(businessId, year, month)
            : Promise.resolve(EMPTY_INVENTORY_SUMMARY),
          showInventorySpend
            ? getBrandSpendSummary(businessId, year, month)
            : Promise.resolve([] as BrandSpendSummary[]),
          getPaidAppointmentsMissingCommission(businessId),
          listPaymentsInRange(businessId, startIso, endIsoExclusive),
        ])
      : [
          EMPTY_SPLIT,
          EMPTY_PAYOUTS,
          [] as StaffAdvance[],
          [],
          EMPTY_INVENTORY_SUMMARY,
          [] as BrandSpendSummary[],
          [],
          [] as PaymentExportRow[],
        ];

  const activeStaff = staffMembers
    .filter((member) => member.is_active)
    .map((member) => ({ id: member.id, name: member.name }));

  const staffContacts = staffMembers.map((member) => ({
    name: member.name,
    phone: member.phone,
  }));

  return (
    <MoneyView
      businessId={businessId}
      range={range}
      stats={stats}
      cashUpiSplit={cashUpiSplit}
      paymentsForExport={paymentsForExport}
      showInventorySpend={showInventorySpend}
      inventorySummary={inventorySummary}
      brandSpend={brandSpend}
      staffPanels={
        <>
          <MissingCommissionRetries items={missingCommissions} />
          <StaffAdvances advances={staffAdvances} staffMembers={activeStaff} />
          <StaffPayouts
            payouts={staffPayouts}
            staffContacts={staffContacts}
            salonName={salonName}
            monthLabel={monthLabel}
          />
        </>
      }
    />
  );
}
