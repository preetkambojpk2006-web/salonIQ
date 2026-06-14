"use client";

import { Sparkles } from "lucide-react";
import { useT } from "@/lib/i18n/LanguageContext";

type VibeCardProps = {
  notes: string | null | undefined;
};

export function VibeCard({ notes }: VibeCardProps) {
  const { t } = useT();
  const trimmed = notes?.trim();
  if (!trimmed) return null;

  return (
    <div
      style={{
        width: "100%",
        borderRadius: 12,
        background: "#E8D9C0",
        border: "1px solid #E0DAD0",
        padding: "12px 14px",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 12,
          fontWeight: 700,
          color: "#1A1A1A",
          letterSpacing: "0.02em",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <Sparkles size={13} strokeWidth={2.25} aria-hidden />
        {t("customers.vibeLabel")}
      </p>
      <p
        style={{
          margin: "8px 0 0",
          fontSize: 14,
          color: "#1A1A1A",
          lineHeight: 1.5,
        }}
      >
        {trimmed}
      </p>
    </div>
  );
}
