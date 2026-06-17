"use client";

import { Bot } from "lucide-react";
import Link from "next/link";
import { useT } from "@/lib/i18n/LanguageContext";

type CoachTeaserProps = {
  topInsightTitle: string | null;
};

export function CoachTeaser({ topInsightTitle }: CoachTeaserProps) {
  const { t } = useT();

  return (
    <article
      style={{
        borderRadius: 16,
        border: "1px solid #E0DAD0",
        background: "#EDE8DF",
        padding: 18,
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Bot
          className="shrink-0"
          size={18}
          strokeWidth={1.75}
          color="#1A1A1A"
          aria-hidden
        />
        <p
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 700,
            color: "#1A1A1A",
          }}
        >
          {t("coach.aiBusinessCoach")}
        </p>
      </div>

      <p style={{ margin: "8px 0 0", fontSize: 14, color: "#8A8A8A" }}>
        {t("coach.teaserSubtitle")}
      </p>

      <p
        style={{
          margin: "12px 0 0",
          fontSize: 14,
          fontWeight: 600,
          color: "#1A1A1A",
          lineHeight: 1.4,
        }}
      >
        {topInsightTitle ?? t("coach.teaserEmpty")}
      </p>

      <Link
        href="/dashboard/coach"
        style={{
          display: "inline-block",
          marginTop: 14,
          minHeight: 40,
          padding: "8px 14px",
          borderRadius: 10,
          border: "1px solid #E0DAD0",
          background: "#fff",
          color: "#1A1A1A",
          fontSize: 14,
          fontWeight: 700,
          textDecoration: "none",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        className="active:scale-[0.98] motion-reduce:active:scale-100"
      >
        {t("coach.teaserLink")}
      </Link>
    </article>
  );
}
