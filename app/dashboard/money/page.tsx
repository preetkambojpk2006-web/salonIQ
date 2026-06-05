import { MoneyView } from "@/components/money/money-view";
import { getMoneyDashboardStats } from "@/lib/payments/queries";

export const dynamic = "force-dynamic";

export default async function MoneyPage() {
  const stats = await getMoneyDashboardStats();

  return <MoneyView stats={stats} />;
}
