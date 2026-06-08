"use client";

import { useEffect } from "react";

type DashboardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardError({ error, reset }: DashboardErrorProps) {
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
          Kuch gadbad ho gayi
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
          Page load nahi ho paya. Please refresh karein — agar phir bhi issue ho to
          thodi der baad try karein.
        </p>
        <button
          type="button"
          onClick={reset}
          className="primary-button"
          style={{ marginTop: 18, minHeight: 44, borderRadius: 10 }}
        >
          Refresh karein
        </button>
      </section>
    </div>
  );
}
