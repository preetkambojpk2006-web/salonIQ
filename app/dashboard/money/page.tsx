import { MoneyView } from "@/components/money/money-view";
import { StaffAdvances } from "@/components/money/StaffAdvances";
import { StaffPayouts } from "@/components/money/StaffPayouts";
import { getOwnerBusinessId } from "@/lib/customers/queries";
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

export default async function MoneyPage() {
  const [stats, businessId] = await Promise.all([
    getMoneyDashboardStats(),
    getOwnerBusinessId(),
  ]);

  const { startIso, endIsoExclusive } = getDayBoundsIso();
  const [cashUpiSplit, staffPayouts, staffAdvances, staffMembers] = businessId
    ? await Promise.all([
        getCashUpiSplit(
          businessId,
          new Date(startIso),
          new Date(endIsoExclusive)
        ),
        getStaffPayouts(businessId),
        listStaffAdvances(businessId),
        listStaffMembers(businessId),
      ])
    : [EMPTY_SPLIT, EMPTY_PAYOUTS, [] as StaffAdvance[], []];

  const activeStaff = staffMembers
    .filter((member) => member.is_active)
    .map((member) => ({ id: member.id, name: member.name }));

  return (
    <MoneyView
      stats={stats}
      cashUpiSplit={cashUpiSplit}
      staffPanels={
        <>
          <StaffAdvances advances={staffAdvances} staffMembers={activeStaff} />
          <StaffPayouts payouts={staffPayouts} />
        </>
      }
    />
  );
}
