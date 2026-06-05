import { CommandMobileNav } from "@/components/command-center/mobile-nav";
import { CommandSidebar } from "@/components/command-center/sidebar";
import { CommandTopbar } from "@/components/command-center/topbar";
import { PageTransition } from "@/components/motion/page-transition";
import type { WorkspaceContext } from "@/lib/command-center/get-workspace";

type CommandCenterShellProps = {
  workspace: WorkspaceContext;
  children: React.ReactNode;
  showTopbar?: boolean;
};

export function CommandCenterShell({
  workspace,
  children,
  showTopbar = true,
}: CommandCenterShellProps) {
  return (
    <div className="app-shell">
      <CommandSidebar />
      <div className="workspace">
        {showTopbar ? <CommandTopbar workspace={workspace} /> : null}
        <PageTransition>{children}</PageTransition>
      </div>
      <CommandMobileNav />
    </div>
  );
}
