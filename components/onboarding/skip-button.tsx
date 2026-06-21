"use client";

import { useFormStatus } from "react-dom";

type SkipButtonProps = {
  label: string;
  pendingLabel?: string;
};

export function SkipButton({
  label,
  pendingLabel = "Please wait…",
}: SkipButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className="btn-ghost-link">
      {pending ? pendingLabel : label}
    </button>
  );
}
