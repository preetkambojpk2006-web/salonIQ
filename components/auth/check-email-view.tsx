"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Mail } from "lucide-react";
import { resendConfirmationEmail } from "@/lib/auth/actions";
import { useT } from "@/lib/i18n/LanguageContext";

type CheckEmailViewProps = {
  email: string;
};

export function CheckEmailView({ email }: CheckEmailViewProps) {
  const { t } = useT();
  const [isPending, startTransition] = useTransition();
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleResend = () => {
    setResendError(null);
    setResendSuccess(false);

    const formData = new FormData();
    formData.set("email", email);

    startTransition(async () => {
      const result = await resendConfirmationEmail(formData);

      if (!result.ok) {
        setResendError(
          result.error === "missing-email"
            ? t("auth.resendError")
            : result.error
        );
        return;
      }

      setResendSuccess(true);
    });
  };

  return (
    <div className="stack-6">
      <div className="stack-4 text-center">
        <p className="text-eyebrow">{t("auth.checkEmailEyebrow")}</p>
        <div
          style={{
            display: "grid",
            placeItems: "center",
            width: 48,
            height: 48,
            borderRadius: 16,
            background: "var(--mint-soft)",
            color: "var(--mint)",
            margin: "0 auto",
          }}
        >
          <Mail size={16} strokeWidth={1.5} aria-hidden />
        </div>
        <h1 className="heading-page">{t("auth.checkEmailTitle")}</h1>
        <p className="text-body">
          {email
            ? t("auth.checkEmailBody", { email })
            : t("auth.checkEmailNoEmail")}
        </p>
      </div>

      {resendError ? (
        <div role="alert" className="alert-danger">
          {resendError}
        </div>
      ) : null}

      {resendSuccess ? (
        <div role="status" className="alert-success">
          {t("auth.resendSuccess")}
        </div>
      ) : null}

      <button
        type="button"
        className="btn-primary w-full"
        disabled={isPending || !email}
        onClick={handleResend}
      >
        {isPending ? t("auth.resending") : t("auth.resendEmail")}
      </button>

      <p className="text-center text-body">
        <Link href="/login" className="link-accent">
          {t("auth.backToLogin")}
        </Link>
      </p>
    </div>
  );
}
