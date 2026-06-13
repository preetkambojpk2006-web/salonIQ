const ERROR_MESSAGES: Record<string, string> = {
  INVALID_SLUG: "Queue link sahi nahi hai.",
  SALON_NOT_FOUND: "Yeh salon nahi mila.",
  SALON_CLOSED: "Salon abhi band hai",
  CUSTOMER_NAME_REQUIRED: "Apna naam daalein.",
  CUSTOMER_PHONE_REQUIRED: "Phone number daalein.",
  INVALID_PHONE: "Sahi mobile number daalo (10 digit)",
  RATE_LIMIT_EXCEEDED: "Thodi der baad try karo",
  NO_ACTIVE_STAFF: "Queue abhi available nahi hai",
  NO_ACTIVE_SERVICES: "Queue abhi available nahi hai",
};

export function walkinJoinErrorMessage(error: unknown): string {
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
