"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getActiveNavId } from "@/lib/command-center/navigation";

const items = [
  { id: "today" as const, label: "Today", href: "/dashboard" },
  { id: "calendar" as const, label: "Calendar", href: "/dashboard/calendar" },
  { id: "customers" as const, label: "Customers", href: "/dashboard/customers" },
  { id: "money" as const, label: "Money", href: "/dashboard/money" },
  { id: "more" as const, label: "More", href: "/dashboard/more" },
];

export function CommandMobileNav() {
  const pathname = usePathname();
  const activeId = getActiveNavId(pathname);
  const moreActive = [
    "receptionist",
    "insights",
    "automations",
    "coach",
    "branches",
  ].includes(activeId);

  return (
    <nav className="mobile-bottom-nav desktop:hidden" aria-label="Mobile navigation">
      {items.map((item) => {
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
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
