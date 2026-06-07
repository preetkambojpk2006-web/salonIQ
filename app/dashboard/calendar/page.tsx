import { CalendarView } from "@/components/appointments/calendar-view";
import { listAppointments } from "@/lib/appointments/queries";
import { getOwnerBusiness } from "@/lib/onboarding/queries";

export const dynamic = "force-dynamic";

type CalendarPageProps = {
  searchParams?: {
    booking?: string;
    error?: string;
    added?: string;
    appointment_id?: string;
    paid?: string;
  };
};

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const [appointments, business] = await Promise.all([
    listAppointments(),
    getOwnerBusiness(),
  ]);

  return (
    <CalendarView
      appointments={appointments}
      businessName={business?.name ?? "Your salon"}
      googleReviewLink={business?.google_review_link ?? null}
      openBooking={searchParams?.booking === "new"}
      error={searchParams?.error}
      showAddedToast={searchParams?.added === "1"}
      addedAppointmentId={searchParams?.appointment_id}
      showPaymentToast={searchParams?.paid === "1"}
    />
  );
}
