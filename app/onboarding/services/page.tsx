import { OnboardingError } from "@/components/onboarding/onboarding-error";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { FormField } from "@/components/onboarding/form-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { SkipButton } from "@/components/onboarding/skip-button";
import { createService, skipServices } from "@/lib/onboarding/actions";
import { getOwnerBranches, getOwnerBusiness } from "@/lib/onboarding/queries";
import { redirect } from "next/navigation";

type ServicesPageProps = {
  searchParams: { error?: string };
};

export default async function ServicesOnboardingPage({
  searchParams,
}: ServicesPageProps) {
  const business = await getOwnerBusiness();
  if (!business) {
    redirect("/onboarding/business");
  }

  const branches = await getOwnerBranches(business.id);
  if (branches.length === 0) {
    redirect("/onboarding/branch");
  }

  return (
    <OnboardingShell
      currentStep={4}
      title="Add a service"
      description="Add your first service. You can add more from the dashboard later."
    >
      <OnboardingError error={searchParams.error} />

      <form action={createService} className="stack-4">
        <FormField
          label="Service name"
          name="name"
          placeholder="e.g. Haircut"
          required
        />
        <FormField
          label="Category"
          name="category"
          placeholder="e.g. Hair, Nails, Spa"
        />
        <FormField
          label="Duration (minutes)"
          name="duration_mins"
          type="number"
          min={1}
          placeholder="45"
          required
        />
        <FormField
          label="Price (₹)"
          name="price"
          type="number"
          min={0}
          step="0.01"
          placeholder="499"
          required
        />

        <SubmitButton label="Finish setup" />
      </form>

      <form action={skipServices} className="onboarding-skip-form">
        <SkipButton label="Skip for now" />
      </form>
    </OnboardingShell>
  );
}
