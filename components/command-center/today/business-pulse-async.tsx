import { getDashboardAnalytics } from "@/lib/dashboard/analytics-queries";
import { BusinessPulse } from "@/components/command-center/today/business-pulse";

type BusinessPulseAsyncProps = {
  businessId: string;
};

export async function BusinessPulseAsync({ businessId }: BusinessPulseAsyncProps) {
  const analytics = await getDashboardAnalytics(businessId);
  return <BusinessPulse analytics={analytics} />;
}
