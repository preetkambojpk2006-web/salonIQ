"use client";

import type { UpcomingAppointment } from "@/lib/dashboard/today-queries";
import { RevenueTargetProgress } from "@/components/command-center/today/revenue-target-progress";
import { useT } from "@/lib/i18n/LanguageContext";

type OsHeroProps = {
  nextAppointment: UpcomingAppointment | null;
  revenueToday: number;
  dailyRevenueTarget?: number | null;
  showRevenue?: boolean;
};

function formatRs(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function OsHero({
  nextAppointment,
  revenueToday,
  dailyRevenueTarget = null,
  showRevenue = true,
}: OsHeroProps) {
  const { t } = useT();

  return (
    <section
      aria-label="Live operational status"
      style={{
        borderRadius: 16,
        border: "1px solid #E0DAD0",
        background: "#EDE8DF",
        padding: "16px 18px",
      }}
    >
      <p
        className="eyebrow"
        style={{
          margin: 0,
          marginBottom: 12,
          textTransform: "none",
          letterSpacing: "0.02em",
          color: "#8A8A8A",
        }}
      >
        {t("today.liveSchedule")}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: showRevenue ? "minmax(0, 1fr) auto" : "1fr",
          gap: 16,
          alignItems: "start",
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#8A8A8A" }}>
            {t("today.nextAppointments")}
          </p>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 15,
              fontWeight: 700,
              color: "#1A1A1A",
              lineHeight: 1.4,
            }}
          >
            {nextAppointment
              ? `${nextAppointment.time} · ${nextAppointment.customer}`
              : t("today.noUpcomingBooking")}
          </p>
          {nextAppointment ? (
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#8A8A8A" }}>
              {nextAppointment.service}
              {nextAppointment.staff ? ` · ${nextAppointment.staff}` : ""}
            </p>
          ) : null}
        </div>

        {showRevenue ? (
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#8A8A8A" }}>
              {t("today.todayRevenueLabel")}
            </p>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 18,
                fontWeight: 800,
                color: "#1FA873",
                lineHeight: 1.2,
              }}
            >
              {formatRs(revenueToday)}
            </p>
          </div>
        ) : null}
      </div>

      {showRevenue ? (
        <RevenueTargetProgress
          revenueToday={revenueToday}
          dailyTarget={dailyRevenueTarget}
        />
      ) : null}
    </section>
  );
}
