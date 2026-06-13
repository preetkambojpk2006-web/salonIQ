import type { CSSProperties } from "react";
import {
  listTodayWalkinQueue,
  type WalkinQueueRow,
  type WalkinQueueStatus,
} from "@/lib/walkin/queries";

type WalkinQueuePanelProps = {
  businessId: string;
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

function QueueRow({ entry }: { entry: WalkinQueueRow }) {
  return (
    <article
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "12px 0",
        borderBottom: "1px solid #E0DAD0",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <span
          style={{
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: 999,
            background: "#1FA873",
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
    </article>
  );
}

export async function WalkinQueuePanel({ businessId }: WalkinQueuePanelProps) {
  const queue = await listTodayWalkinQueue(businessId);
  const waitingCount = queue.filter((entry) => entry.status === "waiting").length;

  return (
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
            <QueueRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </section>
  );
}
