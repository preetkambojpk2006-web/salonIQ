import { PublicQueueStatusPage } from "@/components/walkin/PublicQueueStatusPage";

export const dynamic = "force-dynamic";

type QueueStatusPageProps = {
  params: { slug: string; token: string };
};

export default function QueueStatusPage({ params }: QueueStatusPageProps) {
  return (
    <PublicQueueStatusPage slug={params.slug} token={params.token} />
  );
}
