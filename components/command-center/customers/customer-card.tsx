"use client";

import { memo, useEffect, useMemo, useState, useTransition } from "react";
import { AlertTriangle, Ban, Gift } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  getCustomerDisplayTag,
  getCustomerVisitLine,
} from "@/lib/customers/display-tag";
import { redeemCustomerReward, markCustomerRewardNotified, updateCustomerNotes } from "@/lib/customers/actions";
import {
  computeLoyaltyProgress,
  formatLoyaltyProgressLine,
} from "@/lib/customers/loyalty-progress";
import type { BusinessRewardConfig } from "@/lib/customers/loyalty-types";
import type { Customer, CustomerReliability } from "@/lib/customers/types";
import { formatInr } from "@/lib/format/currency";
import { MessageActions } from "@/components/whatsapp/MessageActions";
import { rewardEarned } from "@/lib/whatsapp/templates";
import { useT } from "@/lib/i18n/LanguageContext";

type CustomerCardProps = {
  customer: Customer;
  rewardConfig: BusinessRewardConfig;
  salonName: string;
};

function ReliabilityBadge({ reliability }: { reliability: CustomerReliability }) {
  if (reliability === "good") return null;

  const isWarning = reliability === "warning";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        marginBottom: 8,
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        color: isWarning ? "#1A1A1A" : "#fff",
        background: isWarning ? "#E8D9C0" : "#D94F4F",
        border: isWarning ? "1px solid #C9A96E" : "1px solid #D94F4F",
      }}
    >
      {isWarning ? (
        <AlertTriangle size={16} strokeWidth={1.5} aria-hidden />
      ) : (
        <Ban size={16} strokeWidth={1.5} aria-hidden />
      )}
      {isWarning ? "Warning" : "Blacklisted"}
    </span>
  );
}

function CustomerNotesEditor({
  customerId,
  initialNotes,
}: {
  customerId: string;
  initialNotes: string | null;
}) {
  const { t } = useT();
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setNotes(initialNotes ?? "");
  }, [initialNotes]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    const result = await updateCustomerNotes(customerId, notes);
    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSaved(true);
    router.refresh();
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ marginTop: 12 }}>
      <label
        htmlFor={`customer-notes-${customerId}`}
        className="field-label"
        style={{ fontSize: 12, color: "#8A8A8A", fontWeight: 600 }}
      >
        {t("customers.notesLabel")}
      </label>
      <textarea
        id={`customer-notes-${customerId}`}
        className="textarea-field"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        rows={3}
        placeholder={t("customers.notesPlaceholder")}
        style={{
          marginTop: 6,
          borderRadius: 10,
          borderColor: "#E0DAD0",
          color: "#1A1A1A",
          fontSize: 13,
        }}
      />
      {error ? (
        <p style={{ margin: "6px 0 0", fontSize: 12, color: "#D94F4F" }}>
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        style={{
          marginTop: 8,
          minHeight: 36,
          padding: "6px 14px",
          borderRadius: 10,
          border: "1px solid #1FA873",
          background: "#1FA873",
          color: "#fff",
          fontSize: 13,
          fontWeight: 700,
          cursor: saving ? "not-allowed" : "pointer",
          opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? t("common.saving") : saved ? t("common.saved") : t("common.save")}
      </button>
    </div>
  );
}

function LoyaltyProgressSection({
  customer,
  rewardConfig,
  salonName,
}: {
  customer: Customer;
  rewardConfig: BusinessRewardConfig;
  salonName: string;
}) {
  const { t } = useT();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const progress = useMemo(
    () => computeLoyaltyProgress(customer, rewardConfig),
    [customer, rewardConfig]
  );

  const rewardMessage = useMemo(() => {
    if (!progress?.reward_pending) return "";
    return rewardEarned({
      customerName: customer.name,
      salonName,
      rewardDescription:
        progress.reward_description?.trim() || "special reward",
    });
  }, [progress, customer.name, salonName]);

  if (!progress) {
    return null;
  }

  const progressLine = formatLoyaltyProgressLine(progress);
  const barPercent = progress.reward_pending ? 100 : progress.percent;
  const phone = customer.phone?.trim() ?? "";

  const handleRedeem = () => {
    setError(null);
    startTransition(async () => {
      const result = await redeemCustomerReward(customer.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  const handleRewardWhatsAppSend = () => {
    startTransition(async () => {
      const result = await markCustomerRewardNotified(customer.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div
      style={{
        marginTop: 12,
        padding: "12px 14px",
        borderRadius: 12,
        border: "1px solid #E0DAD0",
        background: progress.reward_pending ? "#F5E6A8" : "#EDE8DF",
      }}
    >
      {progress.reward_pending ? (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 8,
            padding: "4px 10px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 800,
            background: "#1FA873",
            color: "#fff",
          }}
        >
          <Gift size={16} strokeWidth={1.5} aria-hidden />
          {t("customers.rewardReady")}
        </span>
      ) : (
        <p
          style={{
            margin: "0 0 8px",
            fontSize: 12,
            fontWeight: 700,
            color: "#8A8A8A",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Loyalty progress
        </p>
      )}

      <p
        style={{
          margin: 0,
          fontSize: 13,
          fontWeight: 700,
          color: "#1A1A1A",
          lineHeight: 1.45,
        }}
      >
        {progressLine}
      </p>

      <div
        style={{
          marginTop: 10,
          height: 8,
          borderRadius: 999,
          background: "#fff",
          border: "1px solid #E0DAD0",
          overflow: "hidden",
        }}
        aria-hidden
      >
        <div
          style={{
            width: `${barPercent}%`,
            height: "100%",
            borderRadius: 999,
            background: progress.reward_pending ? "#1FA873" : "#1FA873",
            transition: "width 0.3s ease",
          }}
        />
      </div>

      {progress.reward_pending ? (
        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          {phone ? (
            <>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#8A8A8A",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Customer ko batayein
              </p>
              <MessageActions
                phone={phone}
                message={rewardMessage}
                copyLabel="Copy message"
                sendLabel="Send on WhatsApp"
                onSend={handleRewardWhatsAppSend}
              />
              {customer.reward_notified_at ? (
                <p style={{ margin: 0, fontSize: 12, color: "#1FA873", fontWeight: 700 }}>
                  {t("customers.whatsappSent")}
                </p>
              ) : null}
            </>
          ) : (
            <p style={{ margin: 0, fontSize: 12, color: "#8A8A8A" }}>
              {t("customers.addPhoneForWhatsApp")}
            </p>
          )}
          <button
            type="button"
            onClick={handleRedeem}
            disabled={isPending}
            style={{
              minHeight: 36,
              padding: "6px 14px",
              borderRadius: 10,
              border: "1px solid #1A1A1A",
              background: "#1A1A1A",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: isPending ? "not-allowed" : "pointer",
              opacity: isPending ? 0.7 : 1,
              justifySelf: "start",
            }}
          >
            {isPending ? "Saving…" : "Mark redeemed ✓"}
          </button>
        </div>
      ) : null}

      {error ? (
        <p style={{ margin: "8px 0 0", fontSize: 12, color: "#D94F4F" }} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function CustomerCardInner({ customer, rewardConfig, salonName }: CustomerCardProps) {
  const { t } = useT();
  const tag = getCustomerDisplayTag(customer);

  return (
    <article className="customer-card">
      <ReliabilityBadge reliability={customer.reliability} />
      <span className={tag.className}>{tag.label}</span>
      <p className="customer-name">{customer.name}</p>
      {customer.phone ? <p>{customer.phone}</p> : null}
      <strong>{formatInr(customer.total_spend)}</strong>
      <p>{getCustomerVisitLine(customer, t("customers.addVisitNotes"))}</p>
      <LoyaltyProgressSection
        customer={customer}
        rewardConfig={rewardConfig}
        salonName={salonName}
      />
      <CustomerNotesEditor
        customerId={customer.id}
        initialNotes={customer.notes}
      />
    </article>
  );
}

export const CustomerCard = memo(CustomerCardInner);
