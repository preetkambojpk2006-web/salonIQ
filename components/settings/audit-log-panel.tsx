"use client";

import { formatAuditTimestamp } from "@/lib/audit/format";
import type { AuditLogEntry } from "@/lib/audit/types";
import { useT } from "@/lib/i18n/LanguageContext";

type AuditLogPanelProps = {
  entries: AuditLogEntry[];
};

const ACTION_I18N_KEY: Record<string, string> = {
  "appointment.cancelled": "settings.auditActionAppointmentCancelled",
  "appointment.noshow": "settings.auditActionAppointmentNoshow",
  "payment.edited": "settings.auditActionPaymentEdited",
  "service.deleted": "settings.auditActionServiceDeleted",
  "inventory.deleted": "settings.auditActionInventoryDeleted",
  "staff.deactivated": "settings.auditActionStaffDeactivated",
};

function actionLabel(action: string, t: (key: string) => string): string {
  const key = ACTION_I18N_KEY[action];
  return key ? t(key) : action;
}

export function AuditLogPanel({ entries }: AuditLogPanelProps) {
  const { t } = useT();

  return (
    <section className="panel" id="audit-log-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">{t("settings.auditLogEyebrow")}</p>
          <h2>{t("settings.auditLog")}</h2>
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="text-body" style={{ margin: 0, fontSize: 14, color: "#8A8A8A" }}>
          {t("settings.auditLogEmpty")}
        </p>
      ) : (
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table
            style={{
              width: "100%",
              minWidth: 520,
              borderCollapse: "collapse",
              fontSize: 14,
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid #E0DAD0", textAlign: "left" }}>
                <th
                  style={{
                    padding: "10px 12px 10px 0",
                    fontWeight: 600,
                    color: "#8A8A8A",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t("settings.auditLogWhen")}
                </th>
                <th
                  style={{
                    padding: "10px 12px",
                    fontWeight: 600,
                    color: "#8A8A8A",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t("settings.auditLogWho")}
                </th>
                <th
                  style={{
                    padding: "10px 12px",
                    fontWeight: 600,
                    color: "#8A8A8A",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t("settings.auditLogAction")}
                </th>
                <th
                  style={{
                    padding: "10px 0 10px 12px",
                    fontWeight: 600,
                    color: "#8A8A8A",
                  }}
                >
                  {t("settings.auditLogWhat")}
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  style={{ borderBottom: "1px solid #E0DAD0" }}
                >
                  <td
                    style={{
                      padding: "12px 12px 12px 0",
                      color: "#1A1A1A",
                      whiteSpace: "nowrap",
                      verticalAlign: "top",
                    }}
                  >
                    {formatAuditTimestamp(entry.createdAt)}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      color: "#1A1A1A",
                      verticalAlign: "top",
                    }}
                  >
                    {entry.performedByName?.trim() || "—"}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      color: "#1A1A1A",
                      whiteSpace: "nowrap",
                      verticalAlign: "top",
                    }}
                  >
                    {actionLabel(entry.action, t)}
                  </td>
                  <td
                    style={{
                      padding: "12px 0 12px 12px",
                      color: "#1A1A1A",
                      verticalAlign: "top",
                    }}
                  >
                    {entry.entityLabel?.trim() || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
