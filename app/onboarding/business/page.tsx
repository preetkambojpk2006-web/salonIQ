import { OnboardingError } from "@/components/onboarding/onboarding-error";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { FormField } from "@/components/onboarding/form-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { createBusiness } from "@/lib/onboarding/actions";
import { getOwnerBusiness } from "@/lib/onboarding/queries";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type BusinessPageProps = {
  searchParams: { error?: string };
};

export default async function BusinessOnboardingPage({
  searchParams,
}: BusinessPageProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const existing = await getOwnerBusiness();
  if (existing) {
    redirect("/onboarding/branch");
  }

  return (
    <OnboardingShell
      currentStep={1}
      title="Your salon"
      description="Tell us about your business. You can update this anytime."
    >
      <OnboardingError error={searchParams.error} />

      <form action={createBusiness} className="stack-4">
        <FormField
          label="Salon name"
          name="name"
          placeholder="e.g. Glow Studio"
          required
        />
        <FormField
          label="Phone"
          name="phone"
          type="tel"
          placeholder="+91 98765 43210"
        />
        <FormField
          label="Email"
          name="email"
          type="email"
          placeholder={user?.email ?? "contact@salon.com"}
          defaultValue={user?.email ?? ""}
        />
        <FormField
          label="Opening hours"
          name="opening_hours"
          as="textarea"
          placeholder="Mon–Sat, 10am – 8pm"
          hint="Optional — shown to your team later"
        />

        <SubmitButton label="Continue" />
      </form>
    </OnboardingShell>
  );
}
