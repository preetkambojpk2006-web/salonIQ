import { PublicBookingPage } from "@/components/booking/PublicBookingPage";

export const dynamic = "force-dynamic";

type BookPageProps = {
  params: { slug: string };
};

export default function BookPage({ params }: BookPageProps) {
  return <PublicBookingPage slug={params.slug} />;
}
