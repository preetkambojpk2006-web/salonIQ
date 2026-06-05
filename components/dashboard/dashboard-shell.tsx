import { BottomNav } from "@/components/dashboard/bottom-nav";

type DashboardShellProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
};

export function DashboardShell({
  children,
  title,
  subtitle,
}: DashboardShellProps) {
  return (
    <div className="page-shell">
      <div className="mx-auto min-h-screen max-w-lg pb-24">
        {(title || subtitle) && (
          <header className="sticky top-0 z-40 border-b border-border bg-background/95 px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-md">
            {subtitle ? <p className="text-eyebrow">{subtitle}</p> : null}
            {title ? (
              <h1 className="heading-section mt-0.5">{title}</h1>
            ) : null}
          </header>
        )}
        <main className="px-5 py-5">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
