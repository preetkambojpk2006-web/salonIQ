"use client";

import type { WorkspaceContext } from "@/lib/command-center/get-workspace";
import { setSelectedBranchCookie } from "@/lib/command-center/branch-cookie";
import { getActiveNavId } from "@/lib/command-center/navigation";
import { useT } from "@/lib/i18n/LanguageContext";
import { usePathname, useRouter } from "next/navigation";

type CommandTopbarProps = {
  workspace: WorkspaceContext;
};

const titleByNav = {
  today: "Today Command Center",
  receptionist: "WhatsApp AI Receptionist",
  calendar: "Smart Appointment System",
  customers: "Customer CRM",
  money: "Money",
  attendance: "Staff Attendance",
  inventory: "Stock & Inventory",
  insights: "Insights",
  automations: "Automation Engine",
  coach: "Business Tips",
  branches: "Multi-Branch Control",
  services: "Services & Staff",
  settings: "Salon Settings",
};

export function CommandTopbar({ workspace }: CommandTopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const activeId = getActiveNavId(pathname);
  const { t } = useT();

  if (pathname.startsWith("/dashboard/calendar")) {
    return null;
  }

  const showBranchSelect = workspace.branches.length > 1;
  const selectedBranchId =
    workspace.selectedBranchId ?? workspace.branches[0]?.id ?? "";

  function handleBranchChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const branchId = event.target.value;
    if (!branchId || branchId === selectedBranchId) return;
    setSelectedBranchCookie(branchId);
    window.location.reload();
  }

  return (
    <header className="topbar">
      <div>
        <p className="eyebrow" style={{ textTransform: "none", letterSpacing: "0.01em" }}>
          {workspace.greeting}
        </p>
        <h1>{titleByNav[activeId]}</h1>
      </div>

      <div className="topbar-actions">
        {showBranchSelect ? (
          <select
            id="branch-select"
            className="branch-select"
            aria-label="Select branch"
            value={selectedBranchId}
            onChange={handleBranchChange}
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
          {t("today.newBooking")}
        </button>
      </div>
    </header>
  );
}
