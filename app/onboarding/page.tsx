import { getOnboardingRedirect } from "@/lib/onboarding/status";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  redirect(await getOnboardingRedirect());
}
