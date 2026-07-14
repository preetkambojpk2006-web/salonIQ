import { Skeleton } from "@/components/ui/skeleton";

function ChartCardSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <article className="panel business-pulse-card">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-3 h-5 w-40" />
      <Skeleton
        className={`mt-4 w-full rounded-[12px] ${tall ? "h-[260px]" : "h-[220px]"}`}
      />
    </article>
  );
}

export function BusinessPulseSkeleton() {
  return (
    <section className="panel business-pulse-section">
      <div className="panel-header">
        <div>
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-2 h-6 w-44" />
        </div>
      </div>
      <div className="business-pulse-grid">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
        <ChartCardSkeleton tall />
      </div>
    </section>
  );
}
