type OpeningHoursRecord = {
  display?: string;
  onboarding_skips?: {
    staff?: boolean;
    services?: boolean;
  };
  [key: string]: unknown;
};

export function parseOpeningHours(raw: unknown): OpeningHoursRecord {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  return raw as OpeningHoursRecord;
}

export function withOnboardingSkip(
  raw: unknown,
  skip: "staff" | "services"
): OpeningHoursRecord {
  const current = parseOpeningHours(raw);
  return {
    ...current,
    onboarding_skips: {
      ...current.onboarding_skips,
      [skip]: true,
    },
  };
}
