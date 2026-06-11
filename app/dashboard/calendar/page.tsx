import { CalendarView } from "@/components/appointments/calendar-view";
import { canManageFinance, getUserMembership } from "@/lib/auth/membership";
import {
  listAppointments,
  listOnlinePendingAppointments,
} from "@/lib/appointments/queries";
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
  const [appointments, onlinePending, business, membership] = await Promise.all([
    listAppointments(),
    listOnlinePendingAppointments(),
    getOwnerBusiness(),
    getUserMembership(),
  ]);
  const appRole = membership?.appRole ?? "owner";

  return (
    <CalendarView
      appointments={appointments}
      onlinePending={onlinePending}
      businessName={business?.name ?? "Your salon"}
      googleReviewLink={business?.google_review_link ?? null}
      canManageFinance={canManageFinance(appRole)}
      openBooking={searchParams?.booking === "new"}
      error={searchParams?.error}
      showAddedToast={searchParams?.added === "1"}
      addedAppointmentId={searchParams?.appointment_id}
      showPaymentToast={searchParams?.paid === "1"}
    />
  );
}
