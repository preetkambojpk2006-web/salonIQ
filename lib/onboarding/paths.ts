export type OnboardingStep =
  | "business"
  | "branch"
  | "staff"
  | "services"
  | "complete";

export function onboardingPathForStep(step: OnboardingStep): string {
  switch (step) {
    case "business":
      return "/onboarding/business";
    case "branch":
      return "/onboarding/branch";
    case "staff":
      return "/onboarding/staff";
    case "services":
      return "/onboarding/services";
    case "complete":
      return "/dashboard";
  }
}
