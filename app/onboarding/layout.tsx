import { getAuthenticatedLandingPath } from "@/lib/auth/business-approval";
import { createClient } from "@/lib/supabase/server";
import { getOnboardingStep } from "@/lib/onboarding/status";
import { redirect } from "next/navigation";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const step = await getOnboardingStep();

  if (step === "complete") {
    redirect(await getAuthenticatedLandingPath(supabase));
  }

  return <>{children}</>;
}
