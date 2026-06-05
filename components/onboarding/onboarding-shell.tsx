import { signOut } from "@/lib/auth/actions";

const steps = [
  { id: 1, label: "Salon" },
  { id: 2, label: "Branch" },
  { id: 3, label: "Staff" },
  { id: 4, label: "Services" },
] as const;

type OnboardingShellProps = {
  currentStep: 1 | 2 | 3 | 4;
  title: string;
  description: string;
  children: React.ReactNode;
};

export function OnboardingShell({
  currentStep,
  title,
  description,
  children,
}: OnboardingShellProps) {
  return (
    <div className="onboarding-page">
      <div className="onboarding-wrap">
        <p className="eyebrow">SalonIQ setup</p>

        <nav className="onboarding-steps" aria-label="Setup progress">
          {steps.map((step) => {
            const isDone = step.id < currentStep;
            const isCurrent = step.id === currentStep;

            return (
              <div key={step.id} className="onboarding-step">
                <div
                  className={`onboarding-step-bar ${
                    isDone ? "is-done" : isCurrent ? "is-active" : ""
                  }`}
                  aria-hidden
                />
                <span
                  className={`onboarding-step-label ${
                    isDone ? "is-done" : isCurrent ? "is-active" : ""
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </nav>

        <div className="onboarding-card">
          <header className="onboarding-card-header">
            <h1>{title}</h1>
            <p>{description}</p>
          </header>
          <div className="onboarding-card-body">{children}</div>
        </div>

        <form action={signOut} className="onboarding-footer">
          <button type="submit">
            Step {currentStep} of 4 · Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
