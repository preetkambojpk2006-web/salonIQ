"use client";

import { useT } from "@/lib/i18n/LanguageContext";
import { BRANCH_LIMIT_ERROR_CODE } from "@/lib/branches/limit";

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
  const { t } = useT();

  if (!error) return null;

  const decoded = safeDecode(error);
  const message =
    decoded === BRANCH_LIMIT_ERROR_CODE
      ? t("branches.limitReached")
      : decoded;

  return (
    <div role="alert" className="alert-danger mb-4">
      {message}
    </div>
  );
}
