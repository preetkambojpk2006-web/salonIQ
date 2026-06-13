import { WalkinQueuePanelClient } from "@/components/command-center/today/walkin-queue-panel-client";
import { listTodayWalkinQueue } from "@/lib/walkin/queries";

type WalkinQueuePanelProps = {
  businessId: string;
};

export async function WalkinQueuePanel({ businessId }: WalkinQueuePanelProps) {
  const queue = await listTodayWalkinQueue(businessId);

  return (
    <WalkinQueuePanelClient businessId={businessId} initialQueue={queue} />
  );
}
