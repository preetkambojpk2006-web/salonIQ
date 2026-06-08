import { Skeleton } from "@/components/ui/skeleton";

export function TodayPageSkeleton() {
  return (
    <div className="view-stack">
      <div className="os-hero skeleton-hero">
        <div className="hero-copy">
          <Skeleton className="h-3 w-36" />
          <Skeleton className="mt-3 h-10 w-full max-w-lg" />
          <Skeleton className="mt-3 h-4 w-full max-w-md" />
          <div className="hero-actions mt-6 flex gap-2">
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="flow-console">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
      <div className="summary-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
      <div className="two-column">
        <PanelSkeleton rows={4} />
        <PanelSkeleton rows={2} />
      </div>
    </div>
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="metric-card skeleton-metric-card">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-4 h-8 w-28" />
      <Skeleton className="mt-3 h-3 w-32" />
    </div>
  );
}

export function PanelSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-2 h-5 w-40" />
        </div>
      </div>
      <div className="appointment-list">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="skeleton-row h-[72px] w-full" />
        ))}
      </div>
    </section>
  );
}

export function CalendarPageSkeleton() {
  return (
    <div className="view-stack">
      <section className="panel">
        <div className="panel-header">
          <div>
            <Skeleton className="h-3 w-32" />
            <Skeleton className="mt-2 h-5 w-48" />
          </div>
          <Skeleton className="h-10 w-56" />
        </div>
        <div className="calendar-grid skeleton-calendar">
          {Array.from({ length: 15 }).map((_, i) => (
            <Skeleton key={i} className="skeleton-cell min-h-[74px]" />
          ))}
        </div>
      </section>
    </div>
  );
}

export function CustomersPageSkeleton() {
  return (
    <div className="view-stack">
      <section className="panel">
        <div className="panel-header">
          <div>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2 h-5 w-40" />
          </div>
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="customer-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="customer-card skeleton-metric-card">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="mt-3 h-4 w-32" />
              <Skeleton className="mt-4 h-7 w-24" />
              <Skeleton className="mt-3 h-3 w-full" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function InsightsPageSkeleton() {
  return (
    <div className="view-stack">
      <section className="panel">
        <div className="panel-header">
          <Skeleton className="h-3 w-36" />
          <Skeleton className="mt-2 h-5 w-56" />
        </div>
        <div className="insights-board">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="skeleton-metric-card min-h-[140px]" />
          ))}
        </div>
      </section>
      <section className="panel">
        <div className="panel-header">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-2 h-5 w-40" />
        </div>
        <HeatmapSkeleton />
      </section>
    </div>
  );
}

export function HeatmapSkeleton() {
  return (
    <div className="heatmap skeleton-heatmap">
      {Array.from({ length: 48 }).map((_, i) => (
        <Skeleton key={i} className="skeleton-cell min-h-[42px]" />
      ))}
    </div>
  );
}

export function AutomationsPageSkeleton() {
  return (
    <div className="view-stack">
      <section className="panel">
        <div className="panel-header">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="automation-list">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="skeleton-row h-[88px] w-full" />
          ))}
        </div>
      </section>
    </div>
  );
}

export function ReceptionistPageSkeleton() {
  return (
    <div className="view-stack">
      <div className="receptionist-layout">
        <section className="panel chat-panel">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="mt-4 h-[480px] w-full" />
        </section>
        <PanelSkeleton rows={5} />
      </div>
    </div>
  );
}

export function MoneyPageSkeleton() {
  return (
    <div className="view-stack">
      <div className="summary-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
      <PanelSkeleton rows={4} />
    </div>
  );
}

export function BranchesPageSkeleton() {
  return (
    <div className="view-stack">
      <section className="panel">
        <div className="panel-header">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-2 h-5 w-44" />
        </div>
        <div className="branch-grid">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="skeleton-metric-card min-h-[120px]" />
          ))}
        </div>
      </section>
    </div>
  );
}

export function GenericPageSkeleton() {
  return (
    <div className="view-stack">
      <PanelSkeleton rows={3} />
    </div>
  );
}
