"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AlertTriangle } from "lucide-react";
import { Toast } from "@/components/ui/toast";
import { retryCommissionForAppointment } from "@/lib/staff/actions";
import type { MissingCommissionAppointment } from "@/lib/staff/types";
import { useT } from "@/lib/i18n/LanguageContext";

type MissingCommissionRetriesProps = {
  items: MissingCommissionAppointment[];
};

function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function RetryRow({ item }: { item: MissingCommissionAppointment }) {
  const { t } = useT();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    variant: "success" | "error" | "warning";
  }>({ show: false, message: "", variant: "success" });

  const handleRetry = () => {
    setError(null);
    startTransition(async () => {
      const result = await retryCommissionForAppointment(item.appointmentId);

      if (!result.ok) {
        const message =
          result.error === "commission-retry-not-paid"
            ? t("money.commissionRetryNotPaid")
            : result.error === "missing-appointment"
              ? t("money.commissionRetryFailed")
              : result.error;
        setError(message);
        setToast({ show: true, message, variant: "error" });
        return;
      }

      setToast({
        show: true,
        message: t("money.commissionRetrySuccess"),
        variant: "success",
      });
      router.refresh();
    });
  };

  const label = item.serviceName
    ? `${item.staffName} · ${item.serviceName}`
    : item.staffName;

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "10px 0",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{label}</p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--muted)" }}>
            {formatWhen(item.startTime)} · {formatInr(item.totalAmount)}
          </p>
          {error ? (
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#D94F4F" }}>
              {error}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className="demo-button"
          disabled={isPending}
          onClick={handleRetry}
          style={{ minHeight: 36, flexShrink: 0 }}
        >
          {isPending ? t("money.retryingCommission") : t("money.retryCommission")}
        </button>
      </div>
      <Toast
        message={toast.message}
        show={toast.show}
        variant={toast.variant}
        durationMs={5000}
        onDismiss={() => setToast((prev) => ({ ...prev, show: false }))}
      />
    </>
  );
}

export function MissingCommissionRetries({ items }: MissingCommissionRetriesProps) {
  const { t } = useT();

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <AlertTriangle size={16} strokeWidth={1.5} aria-hidden style={{ color: "#C9A96E", marginTop: 2 }} />
          <div>
            <p className="eyebrow">{t("money.missingCommissionEyebrow")}</p>
            <h2>{t("money.missingCommissionTitle")}</h2>
            <p className="text-body" style={{ marginTop: 6 }}>
              {t("money.missingCommissionHint")}
            </p>
          </div>
        </div>
      </div>
      <div>
        {items.map((item) => (
          <RetryRow key={item.appointmentId} item={item} />
        ))}
      </div>
    </section>
  );
}
