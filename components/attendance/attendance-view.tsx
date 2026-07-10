"use client";

import { useMemo, useRef, useState } from "react";
import { Check, Clock, LogIn, X } from "lucide-react";
import { Toast } from "@/components/ui/toast";
import {
  checkInStaff,
  correctStaffAttendance,
  markStaffAbsent,
} from "@/lib/attendance/actions";
import { formatTime12hInSalon } from "@/lib/format/time";
import { useBusinessRealtimeRefresh } from "@/lib/supabase/use-business-realtime";
import type {
  ActiveStaffMember,
  AttendanceRecordEntry,
  AttendanceRecordsPeriod,
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
  weekRecords: AttendanceRecordsPeriod;
  monthRecords: AttendanceRecordsPeriod;
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

const ICON = { size: 16, strokeWidth: 1.5 as const };

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

function statusLabel(
  status: AttendanceStatus,
  t: (key: string) => string
): string {
  if (status === "present") return t("attendance.present");
  if (status === "late") return t("attendance.late");
  return t("attendance.absent");
}

function useAttendanceToast() {
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    variant: "success" | "error";
  }>({ show: false, message: "", variant: "success" });

  return {
    toast,
    setToast,
    dismiss: () => setToast((current) => ({ ...current, show: false })),
  };
}

function handleFineToast(
  result: {
    fineCreated: boolean;
    fineRemoved: boolean;
    fineAmount: number;
  },
  setToast: ReturnType<typeof useAttendanceToast>["setToast"],
  t: (key: string, vars?: Record<string, string>) => string
) {
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
}

function StaffTodayCard({
  staffMember,
  attendanceRow,
  lateFineAmount,
}: {
  staffMember: ActiveStaffMember;
  attendanceRow: StaffAttendanceRow | null;
  lateFineAmount: number;
}) {
  const { t } = useT();
  const { toast, setToast, dismiss } = useAttendanceToast();
  const requestSeq = useRef(0);
  const [showCorrection, setShowCorrection] = useState(false);

  const status = attendanceRow?.status ?? null;
  const isCheckedIn = status === "present" || status === "late";
  const cardStyles = statusStyles(status);

  const runAction = (
    action: (formData: FormData) => Promise<{
      ok: boolean;
      error?: string;
      fineCreated?: boolean;
      fineRemoved?: boolean;
      fineAmount?: number;
    }>,
    extra?: (formData: FormData) => void,
    onSuccess?: () => void
  ) => {
    const formData = new FormData();
    formData.set("staff_id", staffMember.id);
    formData.set("staff_name", staffMember.name);
    formData.set("late_fine_amount", String(lateFineAmount));
    extra?.(formData);

    const seq = (requestSeq.current += 1);

    void action(formData)
      .then((result) => {
        if (requestSeq.current !== seq) return;
        if (!result.ok) {
          setToast({
            show: true,
            message:
              result.error === "Already checked in for today."
                ? t("attendance.alreadyCheckedIn")
                : (result.error ?? t("attendance.networkError")),
            variant: "error",
          });
          return;
        }
        if (
          result.fineCreated !== undefined &&
          result.fineRemoved !== undefined &&
          result.fineAmount !== undefined
        ) {
          handleFineToast(
            {
              fineCreated: result.fineCreated,
              fineRemoved: result.fineRemoved,
              fineAmount: result.fineAmount,
            },
            setToast,
            t
          );
        }
        onSuccess?.();
      })
      .catch(() => {
        if (requestSeq.current === seq) {
          setToast({
            show: true,
            message: t("attendance.networkError"),
            variant: "error",
          });
        }
      });
  };

  const checkInTimeLabel =
    isCheckedIn && attendanceRow?.marked_at
      ? formatTime12hInSalon(attendanceRow.marked_at)
      : null;

  return (
    <article
      style={{
        padding: "14px 16px",
        borderRadius: 16,
        border: `1px solid ${status ? cardStyles.border : TOKENS.borderSubtle}`,
        background: status ? cardStyles.bg : "#fff",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 10,
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
            {staffMember.name}
          </p>
          {staffMember.role ? (
            <p
              style={{
                margin: "2px 0 0",
                fontSize: 12,
                color: TOKENS.textMuted,
              }}
            >
              {staffMember.role}
            </p>
          ) : null}
        </div>
        {status ? (
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: cardStyles.color,
              whiteSpace: "nowrap",
            }}
          >
            {statusLabel(status, t)}
          </span>
        ) : null}
      </div>

      {checkInTimeLabel ? (
        <p
          style={{
            margin: "8px 0 0",
            fontSize: 14,
            fontWeight: 600,
            color: TOKENS.textDark,
          }}
        >
          {t("attendance.checkInTime", { time: checkInTimeLabel })}
        </p>
      ) : null}

      {attendanceRow?.owner_corrected ? (
        <p
          style={{
            margin: "6px 0 0",
            fontSize: 12,
            color: TOKENS.textMuted,
          }}
        >
          {t("attendance.ownerCorrectedNote")}
        </p>
      ) : null}

      {status === "late" && lateFineAmount > 0 ? (
        <p style={{ margin: "6px 0 0", fontSize: 12, color: TOKENS.accentOrange }}>
          {t("attendance.lateFineNote", { amount: formatInr(lateFineAmount) })}
        </p>
      ) : null}

      {!isCheckedIn ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 12,
          }}
        >
          <button
            type="button"
            onClick={() => runAction(checkInStaff)}
            className="primary-button"
            style={{
              flex: "1 1 140px",
              minHeight: 44,
              borderRadius: 10,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <LogIn {...ICON} aria-hidden />
            {t("attendance.checkInNow")}
          </button>
          <button
            type="button"
            onClick={() => runAction(markStaffAbsent)}
            style={{
              flex: "1 1 120px",
              minHeight: 44,
              borderRadius: 10,
              border: `1px solid ${TOKENS.borderSubtle}`,
              background: "#fff",
              color: TOKENS.textDark,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <X {...ICON} aria-hidden />
            {t("attendance.markAbsent")}
          </button>
        </div>
      ) : (
        <div style={{ marginTop: 12 }}>
          <button
            type="button"
            onClick={() => setShowCorrection((open) => !open)}
            style={{
              padding: 0,
              border: 0,
              background: "transparent",
              color: TOKENS.textMuted,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            {t("attendance.ownerCorrection")}
          </button>

          {showCorrection ? (
            <div style={{ marginTop: 10 }}>
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: 12,
                  color: TOKENS.textMuted,
                  lineHeight: 1.4,
                }}
              >
                {t("attendance.ownerCorrectionHelp")}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {(
                  [
                    { status: "present" as const, Icon: Check },
                    { status: "late" as const, Icon: Clock },
                    { status: "absent" as const, Icon: X },
                  ] as const
                ).map(({ status: nextStatus, Icon }) => {
                  const active = status === nextStatus;
                  const styles = statusStyles(active ? nextStatus : null);

                  return (
                    <button
                      key={nextStatus}
                      type="button"
                      onClick={() =>
                        runAction(
                          correctStaffAttendance,
                          (formData) => formData.set("status", nextStatus),
                          () => setShowCorrection(false)
                        )
                      }
                      style={{
                        flex: "1 1 90px",
                        minHeight: 40,
                        padding: "0 10px",
                        borderRadius: 10,
                        border: `1px solid ${active ? styles.border : TOKENS.borderSubtle}`,
                        background: active ? styles.bg : "#fff",
                        color: active ? styles.color : TOKENS.textDark,
                        fontSize: 13,
                        fontWeight: active ? 700 : 600,
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
                        <Icon {...ICON} aria-hidden />
                        {statusLabel(nextStatus, t)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      )}

      <Toast
        message={toast.message}
        show={toast.show}
        variant={toast.variant}
        onDismiss={dismiss}
      />
    </article>
  );
}

function RecordsList({ entries }: { entries: AttendanceRecordEntry[] }) {
  const { t } = useT();

  const grouped = useMemo(() => {
    const map = new Map<string, AttendanceRecordEntry[]>();
    for (const entry of entries) {
      const list = map.get(entry.date) ?? [];
      list.push(entry);
      map.set(entry.date, list);
    }
    return Array.from(map.entries());
  }, [entries]);

  if (entries.length === 0) {
    return (
      <p
        style={{
          margin: "14px 0 0",
          fontSize: 14,
          color: TOKENS.textMuted,
        }}
      >
        {t("attendance.noRecords")}
      </p>
    );
  }

  return (
    <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
      {grouped.map(([date, dayEntries]) => {
        const { dateLabel, dayLabel } = dayEntries[0];

        return (
          <div
            key={date}
            style={{
              borderRadius: 16,
              border: `1px solid ${TOKENS.borderSubtle}`,
              background: "#fff",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "10px 14px",
                borderBottom: `1px solid ${TOKENS.borderSubtle}`,
                background: TOKENS.neutralBg,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 700,
                  color: TOKENS.textDark,
                }}
              >
                {dateLabel}
              </p>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: 12,
                  color: TOKENS.textMuted,
                }}
              >
                {dayLabel}
              </p>
            </div>

            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {dayEntries.map((entry) => {
                const styles = statusStyles(entry.status);

                return (
                  <li
                    key={entry.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: 8,
                      padding: "12px 14px",
                      borderBottom: `1px solid ${TOKENS.borderSubtle}`,
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 14,
                          fontWeight: 700,
                          color: TOKENS.textDark,
                        }}
                      >
                        {entry.staffName}
                      </p>
                      <p
                        style={{
                          margin: "4px 0 0",
                          fontSize: 12,
                          fontWeight: 600,
                          color: styles.color,
                        }}
                      >
                        {statusLabel(entry.status, t)}
                        {entry.ownerCorrected
                          ? ` · ${t("attendance.ownerCorrectedShort")}`
                          : ""}
                      </p>
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: TOKENS.textDark,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {entry.checkInTimeLabel ?? "—"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export function AttendanceView({
  businessId,
  staff,
  todayAttendance,
  monthSummaries,
  weekRecords,
  monthRecords,
  totalOutstandingFines,
  todayDate,
  todayWeekday,
  monthLabel,
  lateFineAmount,
}: AttendanceViewProps) {
  const { t } = useT();

  useBusinessRealtimeRefresh({ businessId, tableSet: "attendance" });
  const [tab, setTab] = useState<"today" | "records" | "summary">("today");
  const [recordsPeriod, setRecordsPeriod] = useState<"week" | "month">("week");

  const todayHeader = t("attendance.todayHeader", {
    date: todayDate,
    day: todayWeekday,
  });

  const attendanceByStaffId = new Map(
    todayAttendance.map((row) => [row.staff_id, row])
  );

  const activeRecords =
    recordsPeriod === "week" ? weekRecords : monthRecords;

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
            { id: "records" as const, label: t("attendance.records") },
            { id: "summary" as const, label: t("attendance.month") },
          ] as const
        ).map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            style={{
              flex: 1,
              minHeight: 44,
              borderRadius: 10,
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
          <p
            style={{
              margin: "8px 0 0",
              fontSize: 13,
              color: TOKENS.textMuted,
              lineHeight: 1.45,
            }}
          >
            {t("attendance.checkInHelp")}
          </p>

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
              {staff.map((member) => (
                <StaffTodayCard
                  key={member.id}
                  staffMember={member}
                  attendanceRow={attendanceByStaffId.get(member.id) ?? null}
                  lateFineAmount={lateFineAmount}
                />
              ))}
            </div>
          )}
        </section>
      ) : null}

      {tab === "records" ? (
        <section
          style={{
            borderRadius: 16,
            border: `1px solid ${TOKENS.borderSubtle}`,
            background: TOKENS.bgMain,
            padding: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
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
                {t("attendance.recordsEyebrow")}
              </p>
              <h2
                style={{
                  margin: "4px 0 0",
                  fontSize: 18,
                  fontWeight: 800,
                  color: TOKENS.textDark,
                }}
              >
                {activeRecords.periodLabel}
              </h2>
            </div>

            <div
              style={{
                display: "flex",
                gap: 6,
                padding: 3,
                borderRadius: 10,
                border: `1px solid ${TOKENS.borderSubtle}`,
                background: "#fff",
              }}
            >
              {(
                [
                  { id: "week" as const, label: t("attendance.week") },
                  { id: "month" as const, label: t("attendance.monthShort") },
                ] as const
              ).map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setRecordsPeriod(id)}
                  style={{
                    minHeight: 36,
                    padding: "0 12px",
                    borderRadius: 8,
                    border: 0,
                    background:
                      recordsPeriod === id ? TOKENS.accentGreen : "transparent",
                    color: recordsPeriod === id ? "#fff" : TOKENS.textDark,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <RecordsList entries={activeRecords.entries} />
        </section>
      ) : null}

      {tab === "summary" ? (
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
                      <td
                        style={{
                          padding: "12px 14px",
                          textAlign: "center",
                          color: TOKENS.accentGreen,
                          fontWeight: 700,
                        }}
                      >
                        {row.presentDays}
                      </td>
                      <td
                        style={{
                          padding: "12px 14px",
                          textAlign: "center",
                          color: TOKENS.accentOrange,
                          fontWeight: 700,
                        }}
                      >
                        {row.lateDays}
                      </td>
                      <td
                        style={{
                          padding: "12px 14px",
                          textAlign: "center",
                          color: TOKENS.accentCoral,
                          fontWeight: 700,
                        }}
                      >
                        {row.absentDays}
                      </td>
                      <td
                        style={{
                          padding: "12px 14px",
                          textAlign: "center",
                          fontWeight: 700,
                        }}
                      >
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
      ) : null}
    </div>
  );
}
