"use client";

import { TrendingUp } from "lucide-react";
import { formatInr } from "@/lib/format/currency";
import type { StaffIncentiveNudge } from "@/lib/commission/nudge";
import { useT } from "@/lib/i18n/LanguageContext";

type StaffIncentivesCardProps = {
  nudges: StaffIncentiveNudge[];
};

const TOKENS = {
  bgMain: "#EDE8DF",
  textDark: "#1A1A1A",
  textMuted: "#8A8A8A",
  borderSubtle: "#E0DAD0",
  accentGreen: "#1FA873",
};

export function StaffIncentivesCard({ nudges }: StaffIncentivesCardProps) {
  const { t } = useT();

  if (nudges.length === 0) {
    return null;
  }

  return (
    <section
      className="panel staff-incentives-card"
      style={{
        borderRadius: 16,
        border: `1px solid ${TOKENS.borderSubtle}`,
        background: TOKENS.bgMain,
        padding: 18,
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: 16,
          fontWeight: 800,
          color: TOKENS.textDark,
        }}
      >
        {t("dashboard.staffNudgeTitle")}
      </h2>

      <ul
        style={{
          listStyle: "none",
          margin: "12px 0 0",
          padding: 0,
          display: "grid",
          gap: 10,
        }}
      >
        {nudges.map((nudge) => (
          <li
            key={nudge.staffName}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 16,
              border: `1px solid ${TOKENS.borderSubtle}`,
              background: "#fff",
            }}
          >
            <TrendingUp
              size={16}
              strokeWidth={1.5}
              color={TOKENS.accentGreen}
              aria-hidden
              style={{ flexShrink: 0, marginTop: 2 }}
            />
            <p
              style={{
                margin: 0,
                fontSize: 14,
                lineHeight: 1.45,
                fontWeight: 600,
              }}
            >
              <span style={{ color: TOKENS.textMuted }}>
                {t("dashboard.staffNudgeLead", {
                  staffName: nudge.staffName,
                  gap: formatInr(nudge.gap),
                })}
              </span>
              <span
                style={{
                  color: TOKENS.accentGreen,
                  fontWeight: 800,
                }}
              >
                {Math.round(nudge.nextRate)}%
              </span>
              <span style={{ color: TOKENS.textMuted }}>
                {t("dashboard.staffNudgeTail")}
              </span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
