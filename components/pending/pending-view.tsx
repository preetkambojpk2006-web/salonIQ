"use client";

import { useFormStatus } from "react-dom";
import { Clock, RefreshCw } from "lucide-react";
import { signOut } from "@/lib/auth/actions";
import { refreshApprovalStatus } from "@/lib/auth/pending-actions";
import { useT } from "@/lib/i18n/LanguageContext";

type PendingViewProps = {
  supportWhatsApp: string;
};

function whatsAppHref(number: string): string {
  const digits = number.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}

function RefreshStatusButton() {
  const { pending } = useFormStatus();
  const { t } = useT();

  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary w-full"
      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
    >
      <RefreshCw size={16} strokeWidth={1.5} aria-hidden />
      {pending ? t("pending.refreshing") : t("pending.refreshStatus")}
    </button>
  );
}

export function PendingView({ supportWhatsApp }: PendingViewProps) {
  const { t } = useT();

  return (
    <div className="auth-shell flex min-h-screen flex-col">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-12">
        <section className="panel">
          <div className="stack-4 text-center">
            <p className="text-eyebrow">{t("pending.eyebrow")}</p>
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
              <Clock size={16} strokeWidth={1.5} aria-hidden />
            </div>
            <h1 className="heading-page text-2xl">{t("pending.title")}</h1>
            <p className="text-body">{t("pending.body")}</p>
            <p className="text-body">
              {t("pending.contact")}{" "}
              {supportWhatsApp ? (
                <a
                  href={whatsAppHref(supportWhatsApp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-accent"
                >
                  {t("pending.contactWhatsApp", { number: supportWhatsApp })}
                </a>
              ) : (
                t("pending.contactFallback")
              )}
            </p>
          </div>

          <form action={refreshApprovalStatus} className="mt-6">
            <RefreshStatusButton />
          </form>

          <form action={signOut} className="mt-3">
            <button type="submit" className="btn-ghost-link w-full">
              {t("pending.logout")}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
