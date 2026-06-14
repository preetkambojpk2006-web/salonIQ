import { CoachPage } from "@/components/coach/CoachPage";
import { getCoachInsights } from "@/lib/coach/insights";
import { getOwnerBusinessId } from "@/lib/customers/queries";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CoachDashboardPage() {
  const businessId = await getOwnerBusinessId();
  if (!businessId) {
    redirect("/onboarding");
  }

  const insights = await getCoachInsights(businessId);

  return <CoachPage insights={insights} />;
}
