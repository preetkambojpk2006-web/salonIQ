"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Clock, X } from "lucide-react";
import { Toast } from "@/components/ui/toast";
import { markStaffAttendance } from "@/lib/attendance/actions";
import { useBusinessRealtimeRefresh } from "@/lib/supabase/use-business-realtime";
import type {
  ActiveStaffMember,
  AttendanceStatus,
  MonthStaffAttendanceSummary,
  StaffAttendanceRow,
} from "@/lib/attendance/types";
import { useT } from "@/lib/i18n/LanguageContext";

type AttendanceViewProps = {
  businessId: string;
  staff: ActiveStaffMember[];
  todayAttendance: StaffAttendanceRow[];
  monthSummaries: MonthStaffAttendanceSummary[];
  totalOutstandingFines: number;
  todayDate: string;
  todayWeekday: string;
  monthLabel: string;
  lateFineAmount: number;
};

const TOKENS = {
  bgMain: "#EDE8DF",
  textDark: "#1A1A1A",
  textMuted: "#8A8A8A",
  borderSubtle: "#E0DAD0",
  accentGreen: "#1FA873",
  accentOrange: "#E07A2F",
  accentCoral: "#D94F4F",
  neutralBg: "#F5F2EC",
};

function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function statusStyles(status: AttendanceStatus | null) {
  if (status === "present") {
    return {
      bg: "#E8F7F0",
      border: TOKENS.accentGreen,
      color: TOKENS.accentGreen,
    };
  }
  if (status === "late") {
    return {
      bg: "#FFF4E8",
      border: TOKENS.accentOrange,
      color: TOKENS.accentOrange,
    };
  }
  if (status === "absent") {
    return {
      bg: "#FDEEEE",
      border: TOKENS.accentCoral,
      color: TOKENS.accentCoral,
    };
  }
  return {
    bg: TOKENS.neutralBg,
    border: TOKENS.borderSubtle,
    color: TOKENS.textMuted,
  };
}

function AttendanceButtons({
  staffMember,
  currentStatus,
  lateFineAmount,
}: {
  staffMember: ActiveStaffMember;
  currentStatus: AttendanceStatus | null;
  lateFineAmount: number;
}) {
  const { t } = useT();
  const [localStatus, setLocalStatus] = useState<AttendanceStatus | null>(
    currentStatus
  );
  // Tracks the latest user intent so a stale/late server response can't
  // overwrite a newer click.
  const requestSeq = useRef(0);

  useEffect(() => {
    setLocalStatus(currentStatus);
  }, [currentStatus]);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    variant: "success" | "error";
  }>({ show: false, message: "", variant: "success" });

  const handleMark = (status: AttendanceStatus) => {
    const previousStatus = localStatus;
    if (status === previousStatus) return;

    // Instant optimistic update — UI never waits on the server.
    setLocalStatus(status);
    const seq = (requestSeq.current += 1);

    const formData = new FormData();
    formData.set("staff_id", staffMember.id);
    formData.set("staff_name", staffMember.name);
    formData.set("status", status);
    formData.set("late_fine_amount", String(lateFineAmount));

    // Fire and forget — sync in the background, revert only on failure.
    void markStaffAttendance(formData)
      .then((result) => {
        const isLatest = requestSeq.current === seq;
        if (!result.ok) {
          if (isLatest) {
            setLocalStatus(previousStatus);
            setToast({ show: true, message: result.error, variant: "error" });
          }
          return;
        }

        if (!isLatest) return;

        if (result.fineCreated && result.fineAmount > 0) {
          setToast({
            show: true,
            message: t("attendance.fineApplied", {
              amount: formatInr(result.fineAmount),
            }),
            variant: "success",
          });
        } else if (result.fineRemoved) {
          setToast({
            show: true,
            message: t("attendance.fineRemoved"),
            variant: "success",
          });
        }
      })
      .catch(() => {
        if (requestSeq.current === seq) {
          setLocalStatus(previousStatus);
          setToast({
            show: true,
            message: t("attendance.networkError"),
            variant: "error",
          });
        }
      });
  };

  const buttons: {
    status: AttendanceStatus;
    label: string;
    Icon: typeof Check;
  }[] = [
    { status: "present", label: t("attendance.present"), Icon: Check },
    { status: "late", label: t("attendance.late"), Icon: Clock },
    { status: "absent", label: t("attendance.absent"), Icon: X },
  ];

  return (
    <>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginTop: 10,
        }}
      >
        {buttons.map(({ status, label, Icon }) => {
          const isActive = localStatus === status;
          const styles = statusStyles(isActive ? status : null);

          return (
            <button
              key={status}
              type="button"
              onClick={() => handleMark(status)}
              style={{
                flex: "1 1 90px",
                minHeight: 40,
                padding: "0 10px",
                borderRadius: 16,
                border: `2px solid ${isActive ? styles.border : TOKENS.borderSubtle}`,
                background: isActive ? styles.bg : "#fff",
                color: isActive ? styles.color : TOKENS.textDark,
                fontSize: 13,
                fontWeight: isActive ? 700 : 600,
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Icon size={14} strokeWidth={2.25} aria-hidden />
                {label}
              </span>
            </button>
          );
        })}
      </div>
      {localStatus === "late" && lateFineAmount > 0 ? (
        <p style={{ margin: "8px 0 0", fontSize: 12, color: TOKENS.accentOrange }}>
          {t("attendance.lateFineNote", { amount: formatInr(lateFineAmount) })}
        </p>
      ) : null}
      <Toast
        message={toast.message}
        show={toast.show}
        variant={toast.variant}
        onDismiss={() => setToast((t) => ({ ...t, show: false }))}
      />
    </>
  );
}

export function AttendanceView({
  businessId,
  staff,
  todayAttendance,
  monthSummaries,
  totalOutstandingFines,
  todayDate,
  todayWeekday,
  monthLabel,
  lateFineAmount,
}: AttendanceViewProps) {
  const { t } = useT();

  useBusinessRealtimeRefresh({ businessId, tableSet: "attendance" });
  const [tab, setTab] = useState<"today" | "month">("today");
  const todayHeader = t("attendance.todayHeader", {
    date: todayDate,
    day: todayWeekday,
  });

  const attendanceByStaffId = new Map(
    todayAttendance.map((row) => [row.staff_id, row.status])
  );

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: 4,
          borderRadius: 16,
          border: `1px solid ${TOKENS.borderSubtle}`,
          background: "#fff",
        }}
      >
        {(
          [
            { id: "today" as const, label: t("attendance.today") },
            { id: "month" as const, label: t("attendance.month") },
          ] as const
        ).map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            style={{
              flex: 1,
              minHeight: 44,
              borderRadius: 12,
              border: 0,
              background: tab === id ? TOKENS.accentGreen : "transparent",
              color: tab === id ? "#fff" : TOKENS.textDark,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "today" ? (
        <section
          style={{
            borderRadius: 16,
            border: `1px solid ${TOKENS.borderSubtle}`,
            background: TOKENS.bgMain,
            padding: 18,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 600,
              color: TOKENS.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {t("attendance.sectionEyebrow")}
          </p>
          <h2
            style={{
              margin: "4px 0 0",
              fontSize: 18,
              fontWeight: 800,
              color: TOKENS.textDark,
            }}
          >
            {todayHeader}
          </h2>

          {staff.length === 0 ? (
            <p
              style={{
                margin: "14px 0 0",
                fontSize: 14,
                color: TOKENS.textMuted,
                lineHeight: 1.45,
              }}
            >
              {t("attendance.noStaff")}
            </p>
          ) : (
            <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
              {staff.map((member) => {
                const status = attendanceByStaffId.get(member.id) ?? null;
                const cardStyles = statusStyles(status);

                return (
                  <article
                    key={member.id}
                    style={{
                      padding: "14px 16px",
                      borderRadius: 16,
                      border: `1px solid ${status ? cardStyles.border : TOKENS.borderSubtle}`,
                      background: status ? cardStyles.bg : "#fff",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 16,
                          fontWeight: 700,
                          color: TOKENS.textDark,
                        }}
                      >
                        {member.name}
                      </p>
                      {member.role ? (
                        <p
                          style={{
                            margin: "2px 0 0",
                            fontSize: 12,
                            color: TOKENS.textMuted,
                          }}
                        >
                          {member.role}
                        </p>
                      ) : null}
                    </div>
                    <AttendanceButtons
                      staffMember={member}
                      currentStatus={status}
                      lateFineAmount={lateFineAmount}
                    />
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <section
          style={{
            borderRadius: 16,
            border: `1px solid ${TOKENS.borderSubtle}`,
            background: TOKENS.bgMain,
            padding: 18,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 600,
              color: TOKENS.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {t("attendance.monthlySummary")}
          </p>
          <h2
            style={{
              margin: "4px 0 0",
              fontSize: 18,
              fontWeight: 800,
              color: TOKENS.textDark,
            }}
          >
            {monthLabel}
          </h2>

          {monthSummaries.length === 0 ? (
            <p
              style={{
                margin: "14px 0 0",
                fontSize: 14,
                color: TOKENS.textMuted,
              }}
            >
              {t("attendance.noMonthData")}
            </p>
          ) : (
            <div
              style={{
                marginTop: 14,
                overflowX: "auto",
                borderRadius: 16,
                border: `1px solid ${TOKENS.borderSubtle}`,
                background: "#fff",
              }}
            >
              <table
                style={{
                  width: "100%",
                  minWidth: 520,
                  borderCollapse: "collapse",
                  fontSize: 14,
                }}
              >
                <thead>
                  <tr style={{ borderBottom: `1px solid ${TOKENS.borderSubtle}` }}>
                    {[
                      t("attendance.staffHeader"),
                      t("status.present"),
                      t("status.late"),
                      t("status.absent"),
                      t("attendance.totalFinesHeader"),
                    ].map((heading, index) => (
                      <th
                        key={heading}
                        style={{
                          padding: "12px 14px",
                          textAlign: index === 0 ? "left" : "center",
                          fontSize: 12,
                          fontWeight: 700,
                          color: TOKENS.textMuted,
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthSummaries.map((row) => (
                    <tr
                      key={row.staffId}
                      style={{ borderBottom: `1px solid ${TOKENS.borderSubtle}` }}
                    >
                      <td
                        style={{
                          padding: "12px 14px",
                          fontWeight: 700,
                          color: TOKENS.textDark,
                        }}
                      >
                        {row.staffName}
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "center", color: TOKENS.accentGreen, fontWeight: 700 }}>
                        {row.presentDays}
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "center", color: TOKENS.accentOrange, fontWeight: 700 }}>
                        {row.lateDays}
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "center", color: TOKENS.accentCoral, fontWeight: 700 }}>
                        {row.absentDays}
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "center", fontWeight: 700 }}>
                        {formatInr(row.totalFines)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div
            style={{
              marginTop: 14,
              paddingTop: 14,
              borderTop: `1px solid ${TOKENS.borderSubtle}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 700, color: TOKENS.textDark }}>
              {t("attendance.outstandingTotal")}
            </span>
            <strong style={{ fontSize: 18, color: TOKENS.accentCoral }}>
              {formatInr(totalOutstandingFines)}
            </strong>
          </div>
        </section>
      )}
    </div>
  );
}
