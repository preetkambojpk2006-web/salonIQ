"use client";

import {
  BarChart2,
  Bot,
  BrainCircuit,
  CalendarDays,
  ClipboardCheck,
  GitBranch,
  Home,
  Package,
  Scissors,
  Settings,
  Users,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/auth/logout-button";
import type { AppRole } from "@/lib/auth/types";
import {
  getActiveNavId,
  getNavItemsForRole,
  type CommandNavId,
} from "@/lib/command-center/navigation";
import { useT } from "@/lib/i18n/LanguageContext";

const NAV_I18N_KEY: Partial<Record<CommandNavId, string>> = {
  today: "nav.today",
  receptionist: "nav.receptionist",
  calendar: "nav.calendar",
  customers: "nav.customers",
  money: "nav.money",
  attendance: "nav.attendance",
  inventory: "nav.inventory",
  insights: "nav.insights",
  automations: "nav.automations",
  coach: "nav.coach",
  branches: "nav.branches",
  services: "nav.services",
  settings: "nav.settings",
};

const NAV_ICON: Record<CommandNavId, LucideIcon> = {
  today: Home,
  receptionist: Bot,
  calendar: CalendarDays,
  customers: Users,
  money: Wallet,
  attendance: ClipboardCheck,
  inventory: Package,
  insights: BarChart2,
  automations: Zap,
  coach: BrainCircuit,
  branches: GitBranch,
  services: Scissors,
  settings: Settings,
};

type CommandSidebarProps = {
  appRole: AppRole;
};

export function CommandSidebar({ appRole }: CommandSidebarProps) {
  const pathname = usePathname();
  const activeId = getActiveNavId(pathname);
  const navItems = getNavItemsForRole(appRole);
  const { t } = useT();

  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <div className="brand-lockup">
        <div className="brand-mark">S</div>
        <div>
          <p className="brand-name">SALONIQ OS</p>
          <p className="brand-subtitle">{t("sidebar.tagline")}</p>
        </div>
      </div>

      <nav className="nav-stack" aria-label="Main">
        {navItems.map((item) => {
          const isActive = item.id === activeId;
          const Icon = NAV_ICON[item.id];
          return (
            <Link
              key={item.id}
              href={item.href}
              prefetch
              className={isActive ? "nav-item active" : "nav-item"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                lineHeight: 1.3,
                paddingTop: 10,
                paddingBottom: 10,
              }}
            >
              <Icon
                size={16}
                strokeWidth={1.5}
                className="shrink-0"
                style={{ color: isActive ? "var(--mint)" : "currentColor" }}
                aria-hidden
              />
              {NAV_I18N_KEY[item.id] ? t(NAV_I18N_KEY[item.id]!) : item.label}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <LogoutButton />
      </div>
    </aside>
  );
}
