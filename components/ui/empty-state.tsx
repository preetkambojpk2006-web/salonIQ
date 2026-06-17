import Link from "next/link";

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  icon?: "customers" | "calendar" | "money";
};

function EmptyIcon({ type }: { type: EmptyStateProps["icon"] }) {
  return (
    <div
      className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-mint-soft"
      aria-hidden
    >
      {type === "customers" && (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-mint">
          <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.75" />
          <path
            d="M5 20c0-3.314 3.134-6 7-6s7 2.686 7 6"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      )}
      {type === "calendar" && (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-mint">
          <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.75" />
          <path d="M8 3v4M16 3v4M4 11h16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      )}
      {type === "money" && (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-mint">
          <path
            d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  icon = "customers",
}: EmptyStateProps) {
  return (
    <div className="px-6 py-12 text-center">
      <EmptyIcon type={icon} />
      <h3 className="mt-6 text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-2 max-w-sm text-body">{description}</p>
      {actionLabel && actionHref ? (
        <Link href={actionHref} className="btn-dark mt-6">
          {actionLabel}
        </Link>
      ) : actionLabel && onAction ? (
        <button type="button" className="btn-dark mt-6" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
