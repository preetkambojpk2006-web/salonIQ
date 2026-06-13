import { PublicQueuePage } from "@/components/walkin/PublicQueuePage";

export const dynamic = "force-dynamic";

type QueuePageProps = {
  params: { slug: string };
};

export default function QueuePage({ params }: QueuePageProps) {
  return <PublicQueuePage slug={params.slug} />;
}
