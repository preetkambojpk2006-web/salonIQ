const ERROR_MESSAGES: Record<string, string> = {
  INVALID_SLUG: "Booking link sahi nahi hai.",
  SALON_NOT_FOUND: "Yeh salon nahi mila.",
  CUSTOMER_NAME_REQUIRED: "Apna naam daalein.",
  CUSTOMER_PHONE_REQUIRED: "Phone number daalein.",
  BOOKING_FIELDS_REQUIRED: "Saari details bharein.",
  STAFF_NOT_AVAILABLE: "Yeh staff ab available nahi hai.",
  SERVICE_NOT_AVAILABLE: "Yeh service ab available nahi hai.",
  START_TIME_PAST: "Past time choose nahi kar sakte.",
  BOOKING_CROSS_DAY: "Booking ek hi din ke andar honi chahiye.",
  OUTSIDE_SALON_HOURS: "Salon 10am se 8pm ke beech open hai.",
  INVALID_SLOT: "30-minute slot choose karein.",
  SLOT_UNAVAILABLE: "Yeh slot ab book ho chuka hai. Doosra time choose karein.",
};

export function publicBookingErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message: string }).message);
    for (const [code, text] of Object.entries(ERROR_MESSAGES)) {
      if (message.includes(code)) {
        return text;
      }
    }
    return "Kuch gadbad ho gayi. Please dobara try karein.";
  }
  return "Kuch gadbad ho gayi. Please dobara try karein.";
}
