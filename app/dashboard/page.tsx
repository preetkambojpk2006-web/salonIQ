import { TodayView } from "@/components/command-center/today/today-view";
import { getTodayDashboardData } from "@/lib/dashboard/today-queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getTodayDashboardData();

  return (
    <TodayView
      metrics={data.metrics}
      upcoming={data.upcoming}
      liveFlow={data.liveFlow}
    />
  );
}
