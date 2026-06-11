export type PublicBookingService = {
  name: string;
  duration_mins: number;
  price: number;
};

export type PublicBookingStaff = {
  name: string;
};

export type PublicBookingContext = {
  salon_name: string;
  opening_hours_display: string;
  services: PublicBookingService[];
  staff: PublicBookingStaff[];
};
