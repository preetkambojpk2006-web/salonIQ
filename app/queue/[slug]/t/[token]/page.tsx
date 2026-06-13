import type { Metadata } from "next";
import { PublicQueueStatus } from "@/components/walkin/PublicQueueStatus";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Aapka Queue Status | SalonIQ",
  description: "Track your walk-in queue status",
};

type QueueStatusPageProps = {
  params: { slug: string; token: string };
};

export default function QueueStatusPage({ params }: QueueStatusPageProps) {
  return <PublicQueueStatus slug={params.slug} token={params.token} />;
}
