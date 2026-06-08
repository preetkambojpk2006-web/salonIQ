import { MoneyView } from "@/components/money/money-view";
import { getOwnerBusinessId } from "@/lib/customers/queries";
import { getDayBoundsIso } from "@/lib/payments/date-utils";
import {
  getCashUpiSplit,
  getMoneyDashboardStats,
} from "@/lib/payments/queries";
import type { CashUpiSplit } from "@/lib/payments/types";

export const dynamic = "force-dynamic";

const EMPTY_SPLIT: CashUpiSplit = {
  cash: 0,
  upi: 0,
  total: 0,
  cashPercent: 0,
  upiPercent: 0,
};

export default async function MoneyPage() {
  const [stats, businessId] = await Promise.all([
    getMoneyDashboardStats(),
    getOwnerBusinessId(),
  ]);

  const { startIso, endIsoExclusive } = getDayBoundsIso();
  const cashUpiSplit = businessId
    ? await getCashUpiSplit(
        businessId,
        new Date(startIso),
        new Date(endIsoExclusive)
      )
    : EMPTY_SPLIT;

  return <MoneyView stats={stats} cashUpiSplit={cashUpiSplit} />;
}
