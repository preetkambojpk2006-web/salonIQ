import { createClient } from "@/lib/supabase/server";
import { getOnboardingRedirect } from "@/lib/onboarding/status";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const supabase = createClient();
  const path = await getOnboardingRedirect(supabase);
  redirect(path);
}
