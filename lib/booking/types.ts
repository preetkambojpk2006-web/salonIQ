export type PublicBookingService = {
  id?: string;
  name: string;
  duration_mins: number;
  price: number;
};

export type PublicBookingStaff = {
  id?: string;
  name: string;
};

export type PublicStaffServicePrice = {
  staff_name: string;
  service_name: string;
  price: number;
};

export type PublicBookingGate = {
  salon_name: string;
  branch_name: string;
  phone: string;
  online_booking_enabled: boolean;
};

export type PublicBookingContext = {
  salon_name: string;
  opening_hours_display: string;
  opening_hours?: Record<string, unknown> | null;
  services: PublicBookingService[];
  staff: PublicBookingStaff[];
  staff_service_prices?: PublicStaffServicePrice[];
};
