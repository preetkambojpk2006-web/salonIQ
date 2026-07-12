import { CalendarView } from "@/components/appointments/calendar-view";
import { canManageFinance, getUserMembership, isOwnerOrAdmin } from "@/lib/auth/membership";
import {
  listAppointments,
  listOnlinePendingAppointments,
} from "@/lib/appointments/queries";
import { getOwnerBusinessId } from "@/lib/customers/queries";
import { getOwnerBusiness } from "@/lib/onboarding/queries";
import { listServices, listStaffMembers } from "@/lib/salon/queries";
import { reviewsSocialFromBusiness } from "@/lib/settings/reviews-social";

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
  const [appointments, onlinePending, business, membership, businessId] =
    await Promise.all([
      listAppointments(),
      listOnlinePendingAppointments(),
      getOwnerBusiness(),
      getUserMembership(),
      getOwnerBusinessId(),
    ]);

  const [services, staffMembers] = businessId
    ? await Promise.all([
        listServices(businessId),
        listStaffMembers(businessId),
      ])
    : [[], []];

  const appRole = membership?.appRole ?? "staff";
  const reviewsSocial = reviewsSocialFromBusiness(business);

  return (
    <CalendarView
      appointments={appointments}
      onlinePending={onlinePending}
      businessId={businessId}
      businessName={business?.name ?? "Your salon"}
      googleReviewLink={business?.google_review_link ?? null}
      reviewsSocial={reviewsSocial}
      services={services}
      staffMembers={staffMembers}
      canManageFinance={canManageFinance(appRole)}
      canEditAppointmentTime={isOwnerOrAdmin(appRole)}
      openBooking={searchParams?.booking === "new"}
      error={searchParams?.error}
      showAddedToast={searchParams?.added === "1"}
      addedAppointmentId={searchParams?.appointment_id}
      showPaymentToast={searchParams?.paid === "1"}
    />
  );
}
