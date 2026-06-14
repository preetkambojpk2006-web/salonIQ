"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AppRole } from "@/lib/auth/types";
import { canAccessNavItem } from "@/lib/auth/route-access";
import { getActiveNavId } from "@/lib/command-center/navigation";
import { useT } from "@/lib/i18n/LanguageContext";

const items = [
  { id: "today" as const, labelKey: "nav.today", href: "/dashboard" },
  { id: "calendar" as const, labelKey: "nav.calendar", href: "/dashboard/calendar" },
  { id: "customers" as const, labelKey: "nav.customers", href: "/dashboard/customers" },
  { id: "money" as const, labelKey: "nav.money", href: "/dashboard/money" },
  { id: "more" as const, labelKey: "nav.more", href: "/dashboard/more" },
] as const;

type CommandMobileNavProps = {
  appRole: AppRole;
};

export function CommandMobileNav({ appRole }: CommandMobileNavProps) {
  const pathname = usePathname();
  const activeId = getActiveNavId(pathname);
  const { t } = useT();
  const visibleItems = items.filter(
    (item) => item.id === "more" || canAccessNavItem(appRole, item.id)
  );
  const moreActive = [
    "receptionist",
    "insights",
    "automations",
    "coach",
    "branches",
    "settings",
  ].includes(activeId);

  return (
    <nav className="mobile-bottom-nav desktop:hidden" aria-label="Mobile navigation">
      {visibleItems.map((item) => {
        const isActive =
          item.id === "more"
            ? moreActive || pathname === "/dashboard/more"
            : item.id === activeId;

        return (
          <Link
            key={item.id}
            href={item.href}
            prefetch
            className={isActive ? "active" : undefined}
          >
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
