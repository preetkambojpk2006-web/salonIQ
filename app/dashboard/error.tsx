"use client";

import { useEffect } from "react";
import { useT } from "@/lib/i18n/LanguageContext";

type DashboardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  const { t } = useT();

  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="view-stack">
      <section
        className="panel"
        style={{
          textAlign: "center",
          padding: "32px 24px",
          borderRadius: 16,
          border: "1px solid #E0DAD0",
          background: "#EDE8DF",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1A1A1A" }}>
          {t("error.title")}
        </h2>
        <p
          style={{
            margin: "12px auto 0",
            maxWidth: 420,
            fontSize: 14,
            color: "#8A8A8A",
            lineHeight: 1.5,
          }}
        >
          {t("error.description")}
        </p>
        <button
          type="button"
          onClick={reset}
          className="primary-button"
          style={{ marginTop: 18, minHeight: 44, borderRadius: 10 }}
        >
          {t("error.refresh")}
        </button>
      </section>
    </div>
  );
}
