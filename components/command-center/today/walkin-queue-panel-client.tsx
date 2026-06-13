"use client";

import { useCallback, useState, type CSSProperties } from "react";
import { Toast } from "@/components/ui/toast";
import {
  performWalkinQueueAction,
  type WalkinQueueAction,
} from "@/lib/walkin/actions";
import type { WalkinQueueRow, WalkinQueueStatus } from "@/lib/walkin/queries";

const pillBase: CSSProperties = {
  padding: "5px 12px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  border: "1px solid transparent",
  lineHeight: 1.2,
  whiteSpace: "nowrap",
};

type WalkinQueuePanelClientProps = {
  businessId: string;
  initialQueue: WalkinQueueRow[];
};

function statusBadgeStyle(status: WalkinQueueStatus): CSSProperties {
  switch (status) {
    case "waiting":
      return { background: "#F5E6A8", color: "#7A5C00" };
    case "called":
      return { background: "#F5D4A8", color: "#8A4B00" };
    case "in_service":
      return { background: "#D4E8DD", color: "#0F6B4A" };
    case "done":
    case "left":
    case "no_show":
    default:
      return { background: "#E8E4DC", color: "#5C5C5C" };
  }
}

function statusLabel(status: WalkinQueueStatus): string {
  switch (status) {
    case "waiting":
      return "Waiting";
    case "called":
      return "Called";
    case "in_service":
      return "In service";
    case "done":
      return "Done";
    case "left":
      return "Left";
    case "no_show":
      return "No show";
    default:
      return status;
  }
}

function formatPhone(phone: string): string {
  if (phone.length === 10) {
    return `${phone.slice(0, 5)} ${phone.slice(5)}`;
  }
  return phone;
}

function isTerminalStatus(status: WalkinQueueStatus): boolean {
  return status === "done" || status === "left" || status === "no_show";
}

type QueueRowProps = {
  entry: WalkinQueueRow;
  updating: boolean;
  flash: boolean;
  onAction: (entryId: string, action: WalkinQueueAction) => void;
};

function QueueRow({ entry, updating, flash, onAction }: QueueRowProps) {
  const terminal = isTerminalStatus(entry.status);

  return (
    <article
      style={{
        padding: "12px 0",
        borderBottom: "1px solid #E0DAD0",
        opacity: terminal ? 0.65 : 1,
        background: flash ? "#D4E8DD" : "transparent",
        borderRadius: flash ? 8 : 0,
        transition: "background 0.4s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            minWidth: 0,
            flex: 1,
          }}
        >
          <span
            style={{
              flexShrink: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: 999,
              background: terminal ? "#B8B8B8" : "#1FA873",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
            }}
            aria-label={`Token number ${entry.daily_token_number}`}
          >
            {entry.daily_token_number}
          </span>
          <div style={{ minWidth: 0 }}>
            <strong
              style={{
                display: "block",
                color: "#1A1A1A",
                fontSize: 15,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {entry.customer_name}
            </strong>
            <p
              style={{
                margin: "2px 0 0",
                fontSize: 13,
                color: "#5C5C5C",
              }}
            >
              {formatPhone(entry.customer_phone)}
            </p>
          </div>
        </div>
        <span
          style={{
            flexShrink: 0,
            padding: "4px 10px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
            ...statusBadgeStyle(entry.status),
          }}
        >
          {statusLabel(entry.status)}
        </span>
      </div>

      {!terminal ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 10,
            marginLeft: 48,
          }}
        >
          {entry.status === "waiting" ? (
            <button
              type="button"
              disabled={updating}
              onClick={() => onAction(entry.id, "call")}
              style={{
                ...pillBase,
                background: "#1FA873",
                color: "#fff",
                opacity: updating ? 0.6 : 1,
                cursor: updating ? "wait" : "pointer",
              }}
            >
              Bulao
            </button>
          ) : null}

          {entry.status === "called" ? (
            <button
              type="button"
              disabled={updating}
              onClick={() => onAction(entry.id, "start")}
              style={{
                ...pillBase,
                background: "#2A9D8F",
                color: "#fff",
                opacity: updating ? 0.6 : 1,
                cursor: updating ? "wait" : "pointer",
              }}
            >
              Shuru karo
            </button>
          ) : null}

          {entry.status === "in_service" ? (
            <>
              <button
                type="button"
                disabled={updating}
                onClick={() => onAction(entry.id, "done")}
                style={{
                  ...pillBase,
                  background: "#1FA873",
                  color: "#fff",
                  opacity: updating ? 0.6 : 1,
                  cursor: updating ? "wait" : "pointer",
                }}
              >
                Done ✓
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={() => onAction(entry.id, "no_show")}
                style={{
                  ...pillBase,
                  background: "#fff",
                  color: "#5C5C5C",
                  border: "1px solid #E0DAD0",
                  opacity: updating ? 0.6 : 1,
                  cursor: updating ? "wait" : "pointer",
                }}
              >
                No-show
              </button>
            </>
          ) : null}

          {entry.status === "waiting" || entry.status === "called" ? (
            <button
              type="button"
              disabled={updating}
              onClick={() => onAction(entry.id, "remove")}
              style={{
                ...pillBase,
                background: "transparent",
                color: "#D94F4F",
                border: "1px solid #D94F4F",
                opacity: updating ? 0.6 : 1,
                cursor: updating ? "wait" : "pointer",
              }}
            >
              Hata do
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export function WalkinQueuePanelClient({
  businessId,
  initialQueue,
}: WalkinQueuePanelClientProps) {
  const [queue, setQueue] = useState(initialQueue);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    variant: "success" | "error";
  }>({ show: false, message: "", variant: "success" });

  const waitingCount = queue.filter((entry) => entry.status === "waiting").length;

  const handleAction = useCallback(
    async (entryId: string, action: WalkinQueueAction) => {
      setUpdatingId(entryId);
      const result = await performWalkinQueueAction(businessId, entryId, action);
      setUpdatingId(null);

      if (!result.ok) {
        setToast({ show: true, message: result.error, variant: "error" });
        return;
      }

      setQueue(result.queue);
      setFlashId(entryId);
      setTimeout(() => setFlashId(null), 600);
      setToast({ show: true, message: result.message, variant: "success" });
    },
    [businessId]
  );

  return (
    <>
      <section
        style={{
          marginBottom: 8,
          padding: 16,
          borderRadius: 16,
          border: "1px solid #E0DAD0",
          background: "#EDE8DF",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: queue.length > 0 ? 8 : 0,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: "#1A1A1A",
            }}
          >
            Walk-in Queue
          </h2>
          <span
            style={{
              padding: "4px 10px",
              borderRadius: 999,
              background: waitingCount > 0 ? "#1FA873" : "#E8E4DC",
              color: waitingCount > 0 ? "#fff" : "#5C5C5C",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {waitingCount} waiting
          </span>
        </div>

        {queue.length === 0 ? (
          <p
            style={{
              margin: "8px 0 0",
              fontSize: 14,
              color: "#5C5C5C",
            }}
          >
            Aaj koi walk-in nahi aaya abhi
          </p>
        ) : (
          <div>
            {queue.map((entry) => (
              <QueueRow
                key={entry.id}
                entry={entry}
                updating={updatingId === entry.id}
                flash={flashId === entry.id}
                onAction={handleAction}
              />
            ))}
          </div>
        )}
      </section>

      <Toast
        message={toast.message}
        show={toast.show}
        variant={toast.variant}
        onDismiss={() => setToast((prev) => ({ ...prev, show: false }))}
      />
    </>
  );
}
