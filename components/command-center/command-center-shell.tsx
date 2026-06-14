import { CommandMobileNav } from "@/components/command-center/mobile-nav";
import { CommandSidebar } from "@/components/command-center/sidebar";
import { CommandTopbar } from "@/components/command-center/topbar";
import { PageTransition } from "@/components/motion/page-transition";
import type { AppRole } from "@/lib/auth/types";
import type { WorkspaceContext } from "@/lib/command-center/get-workspace";

type CommandCenterShellProps = {
  workspace: WorkspaceContext;
  appRole: AppRole;
  children: React.ReactNode;
  showTopbar?: boolean;
};

export function CommandCenterShell({
  workspace,
  appRole,
  children,
  showTopbar = true,
}: CommandCenterShellProps) {
  return (
    <div className="app-shell">
      <CommandSidebar appRole={appRole} />
      <div className="workspace">
        {showTopbar ? <CommandTopbar workspace={workspace} /> : null}
        <PageTransition>{children}</PageTransition>
      </div>
      <CommandMobileNav appRole={appRole} />
    </div>
  );
}
