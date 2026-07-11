"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { useT } from "@/lib/i18n/LanguageContext";

type RevenueTargetProgressProps = {
  revenueToday: number;
  dailyTarget: number | null;
};

function formatRs(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function RevenueTargetProgress({
  revenueToday,
  dailyTarget,
}: RevenueTargetProgressProps) {
  const { t } = useT();

  if (dailyTarget === null || !Number.isFinite(dailyTarget) || dailyTarget <= 0) {
    return (
      <div
        style={{
          marginTop: 14,
          paddingTop: 14,
          borderTop: "1px solid #E0DAD0",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: "#8A8A8A",
            lineHeight: 1.5,
          }}
        >
          {t("today.revenueTargetPrompt")}{" "}
          <Link
            href="/dashboard/settings"
            style={{ color: "#1FA873", fontWeight: 700, textDecoration: "none" }}
          >
            {t("today.openSettings")}
          </Link>
        </p>
      </div>
    );
  }

  const percent = Math.min(
    100,
    Math.round((revenueToday / dailyTarget) * 100)
  );
  const remaining = Math.max(0, dailyTarget - revenueToday);
  const targetMet = revenueToday >= dailyTarget;
  const revenueLabel = formatRs(revenueToday);
  const targetLabel = formatRs(dailyTarget);

  return (
    <div
      style={{
        marginTop: 14,
        paddingTop: 14,
        borderTop: "1px solid #E0DAD0",
      }}
    >
      <p
        style={{
          margin: "0 0 8px",
          fontSize: 12,
          fontWeight: 600,
          color: "#8A8A8A",
        }}
      >
        {t("today.dailyRevenueTarget")}
      </p>

      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Daily revenue target progress"
        style={{
          height: 10,
          borderRadius: 10,
          background: "#E8D9C0",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            height: "100%",
            borderRadius: 10,
            background: "#1FA873",
            transition: "width 0.3s ease",
          }}
        />
      </div>

      <p
        style={{
          margin: "8px 0 0",
          fontSize: 14,
          fontWeight: 700,
          color: "#1A1A1A",
          lineHeight: 1.45,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {targetMet ? (
          <CheckCircle size={16} strokeWidth={1.5} color="#1FA873" aria-hidden />
        ) : null}
        {targetMet
          ? t("today.targetProgressDone", {
              revenue: revenueLabel,
              target: targetLabel,
            })
          : t("today.targetProgressPartial", {
              revenue: revenueLabel,
              target: targetLabel,
              percent: String(percent),
              remaining: formatRs(remaining),
            })}
      </p>
    </div>
  );
}
