import { CoachPage } from "@/components/coach/CoachPage";
import { getCoachInsights } from "@/lib/coach/insights";
import { getOwnerBusinessId } from "@/lib/customers/queries";

export const dynamic = "force-dynamic";

export default async function CoachDashboardPage() {
  const businessId = await getOwnerBusinessId();
  const insights = businessId ? await getCoachInsights(businessId) : [];

  return <CoachPage insights={insights} />;
}
