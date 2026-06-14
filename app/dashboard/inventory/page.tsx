import { InventoryView } from "@/components/inventory/inventory-view";
import { getUserMembership, isOwnerOrAdmin } from "@/lib/auth/membership";
import {
  currentIstYearMonth,
  formatIstMonthLabel,
  getBrandSpendSummary,
  getInventorySummary,
  getRecentTransactions,
  listAllBrands,
  listProductsWithBrand,
} from "@/lib/inventory/queries";
import { todayCalendarDay } from "@/lib/payments/date-utils";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type InventoryPageProps = {
  searchParams?: { year?: string; month?: string };
};

function resolveYearMonth(searchParams?: { year?: string; month?: string }) {
  const current = currentIstYearMonth();
  const year = parseInt(searchParams?.year ?? String(current.year), 10);
  const month = parseInt(searchParams?.month ?? String(current.month), 10);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    month < 1 ||
    month > 12
  ) {
    return current;
  }

  return { year, month };
}

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  const membership = await getUserMembership();

  if (!membership?.businessId) {
    redirect("/login");
  }

  if (!isOwnerOrAdmin(membership.appRole)) {
    redirect("/dashboard");
  }

  const businessId = membership.businessId;
  const { year, month } = resolveYearMonth(searchParams);

  const [brands, products, summary, brandSpend, transactions] =
    await Promise.all([
      listAllBrands(businessId),
      listProductsWithBrand(businessId),
      getInventorySummary(businessId, year, month),
      getBrandSpendSummary(businessId, year, month),
      getRecentTransactions(businessId, 20),
    ]);

  return (
    <InventoryView
      brands={brands}
      products={products}
      summary={summary}
      brandSpend={brandSpend}
      transactions={transactions}
      spendYear={year}
      spendMonth={month}
      spendMonthLabel={formatIstMonthLabel(year, month)}
      todayIso={todayCalendarDay()}
    />
  );
}
