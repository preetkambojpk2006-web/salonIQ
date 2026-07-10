export type PublicBookingService = {
  name: string;
  duration_mins: number;
  price: number;
};

export type PublicBookingStaff = {
  name: string;
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
};
