import { OnboardingError } from "@/components/onboarding/onboarding-error";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { FormField } from "@/components/onboarding/form-field";
import { SelectField } from "@/components/onboarding/select-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { createStaff, skipStaff } from "@/lib/onboarding/actions";
import { getOwnerBranches, getOwnerBusiness } from "@/lib/onboarding/queries";
import { redirect } from "next/navigation";

type StaffPageProps = {
  searchParams: { error?: string };
};

export default async function StaffOnboardingPage({
  searchParams,
}: StaffPageProps) {
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
      currentStep={3}
      title="Add staff"
      description="Add at least one team member for this branch."
    >
      <OnboardingError error={searchParams.error} />

      <form action={createStaff} className="stack-4">
        <SelectField
          label="Branch"
          name="branch_id"
          required
          defaultValue={branches[0]?.id}
          options={branches.map((branch) => ({
            value: branch.id,
            label: branch.name,
          }))}
        />

        <FormField
          label="Name"
          name="name"
          placeholder="e.g. Priya Sharma"
          required
        />
        <FormField
          label="Role"
          name="role"
          placeholder="e.g. Senior stylist"
        />
        <FormField
          label="Phone"
          name="phone"
          type="tel"
          placeholder="+91 98765 43210"
        />

        <SubmitButton label="Continue" />
      </form>

      <form action={skipStaff} className="onboarding-skip-form">
        <button type="submit" className="btn-ghost-link">
          Skip for now
        </button>
      </form>
    </OnboardingShell>
  );
}
