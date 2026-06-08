import { MoneyView } from "@/components/money/money-view";
import { getOwnerBusinessId } from "@/lib/customers/queries";
import { getDayBoundsIso } from "@/lib/payments/date-utils";
import {
  getCashUpiSplit,
  getMoneyDashboardStats,
} from "@/lib/payments/queries";
import type { CashUpiSplit } from "@/lib/payments/types";
import { getStaffPayouts } from "@/lib/staff/payouts";
import type { StaffPayoutsSummary } from "@/lib/staff/types";

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
  totalUnpaid: 0,
};

export default async function MoneyPage() {
  const [stats, businessId] = await Promise.all([
    getMoneyDashboardStats(),
    getOwnerBusinessId(),
  ]);

  const { startIso, endIsoExclusive } = getDayBoundsIso();
  const [cashUpiSplit, staffPayouts] = businessId
    ? await Promise.all([
        getCashUpiSplit(
          businessId,
          new Date(startIso),
          new Date(endIsoExclusive)
        ),
        getStaffPayouts(businessId),
      ])
    : [EMPTY_SPLIT, EMPTY_PAYOUTS];

  return (
    <MoneyView
      stats={stats}
      cashUpiSplit={cashUpiSplit}
      staffPayouts={staffPayouts}
    />
  );
}
