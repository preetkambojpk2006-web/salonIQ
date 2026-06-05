type OnboardingErrorProps = {
  error?: string;
};

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function OnboardingError({ error }: OnboardingErrorProps) {
  if (!error) return null;

  return (
    <div role="alert" className="alert-danger mb-4">
      {safeDecode(error)}
    </div>
  );
}
