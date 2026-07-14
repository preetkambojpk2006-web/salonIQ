import { StaffIncentivesCard } from "@/components/command-center/today/staff-incentives-card";
import { getStaffIncentiveNudges } from "@/lib/commission/nudge";

type StaffIncentivesAsyncProps = {
  businessId: string;
};

export async function StaffIncentivesAsync({
  businessId,
}: StaffIncentivesAsyncProps) {
  const nudges = await getStaffIncentiveNudges(businessId);
  if (nudges.length === 0) {
    return null;
  }

  return <StaffIncentivesCard nudges={nudges} />;
}
