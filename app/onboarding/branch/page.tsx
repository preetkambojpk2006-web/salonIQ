import { OnboardingError } from "@/components/onboarding/onboarding-error";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { FormField } from "@/components/onboarding/form-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { createBranch } from "@/lib/onboarding/actions";
import { getOwnerBusiness } from "@/lib/onboarding/queries";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type BranchPageProps = {
  searchParams: { error?: string };
};

export default async function BranchOnboardingPage({
  searchParams,
}: BranchPageProps) {
  const business = await getOwnerBusiness();
  if (!business) {
    redirect("/onboarding/business");
  }

  const supabase = createClient();
  const { count } = await supabase
    .from("branches")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id);

  if (count && count > 0) {
    redirect("/onboarding/staff");
  }

  return (
    <OnboardingShell
      currentStep={2}
      title="First branch"
      description="Add your main location. You can add more branches later."
    >
      <OnboardingError error={searchParams.error} />

      <form action={createBranch} className="stack-4">
        <FormField
          label="Branch name"
          name="name"
          placeholder="e.g. Koramangala"
          required
        />
        <FormField
          label="Address"
          name="address"
          as="textarea"
          placeholder="Street, area, city"
        />
        <FormField
          label="Phone"
          name="phone"
          type="tel"
          placeholder="+91 98765 43210"
          defaultValue={business.phone ?? ""}
        />

        <SubmitButton label="Continue" />
      </form>
    </OnboardingShell>
  );
}
