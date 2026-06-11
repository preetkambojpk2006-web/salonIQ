"use client";

import type { WorkspaceContext } from "@/lib/command-center/get-workspace";
import { getActiveNavId } from "@/lib/command-center/navigation";
import { usePathname, useRouter } from "next/navigation";

type CommandTopbarProps = {
  workspace: WorkspaceContext;
};

const titleByNav = {
  today: "Today Command Center",
  receptionist: "WhatsApp AI Receptionist",
  calendar: "Smart Appointment System",
  customers: "Customer CRM",
  money: "Business Finance Tracker",
  insights: "AI Business Intelligence",
  automations: "Automation Engine",
  coach: "AI Business Coach",
  branches: "Multi-Branch Control",
  services: "Services & Staff",
  settings: "Salon Settings",
};

export function CommandTopbar({ workspace }: CommandTopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const activeId = getActiveNavId(pathname);

  return (
    <header className="topbar">
      <div>
        <p className="eyebrow" style={{ textTransform: "none", letterSpacing: "0.01em" }}>
          {workspace.greeting}
        </p>
        <h1>{titleByNav[activeId]}</h1>
      </div>

      <div className="topbar-actions">
        {workspace.branches.length > 0 ? (
          <select
            id="branch-select"
            className="branch-select"
            aria-label="Select branch"
            defaultValue={workspace.branches[0]?.id}
          >
            {workspace.branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        ) : null}
        <button
          type="button"
          className="primary-button"
          onClick={() => router.push("/dashboard/calendar?booking=new")}
        >
          New booking
        </button>
      </div>
    </header>
  );
}
