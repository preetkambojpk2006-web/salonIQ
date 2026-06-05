type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
};

export function StatCard({ label, value, hint, icon }: StatCardProps) {
  return (
    <div className="card-surface">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-xs font-medium leading-snug text-muted">
          {label}
        </p>
        <span className="icon-badge h-8 w-8 [&>svg]:!h-4 [&>svg]:!w-4">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tightish text-foreground">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted">{hint ?? "—"}</p>
    </div>
  );
}
