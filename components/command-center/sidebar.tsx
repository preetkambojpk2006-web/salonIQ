"use client";

import { Bot, CalendarCheck, Package } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/auth/actions";
import type { AppRole } from "@/lib/auth/membership";
import {
  getActiveNavId,
  getNavItemsForRole,
} from "@/lib/command-center/navigation";
import { OwnerWhatsappBrief } from "@/components/command-center/owner-whatsapp-brief";

type CommandSidebarProps = {
  appRole: AppRole;
};

export function CommandSidebar({ appRole }: CommandSidebarProps) {
  const pathname = usePathname();
  const activeId = getActiveNavId(pathname);
  const navItems = getNavItemsForRole(appRole);

  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <div className="brand-lockup">
        <div className="brand-mark">S</div>
        <div>
          <p className="brand-name">SALONIQ OS</p>
          <p className="brand-subtitle">AI operating system</p>
        </div>
      </div>

      <nav className="nav-stack" aria-label="Main">
        {navItems.map((item) => {
          const isActive = item.id === activeId;
          return (
            <Link
              key={item.id}
              href={item.href}
              prefetch
              className={isActive ? "nav-item active" : "nav-item"}
              style={
                item.id === "coach" ||
                item.id === "attendance" ||
                item.id === "inventory"
                  ? { display: "flex", alignItems: "center", gap: 8, lineHeight: 1.3, paddingTop: 10, paddingBottom: 10 }
                  : undefined
              }
            >
              {item.id === "coach" ? (
                <Bot
                  className="h-4 w-4 shrink-0"
                  strokeWidth={1.75}
                  aria-hidden
                />
              ) : null}
              {item.id === "attendance" ? (
                <CalendarCheck
                  className="h-4 w-4 shrink-0"
                  strokeWidth={1.75}
                  aria-hidden
                />
              ) : null}
              {item.id === "inventory" ? (
                <Package
                  className="h-4 w-4 shrink-0"
                  strokeWidth={1.75}
                  aria-hidden
                />
              ) : null}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        {appRole === "owner" || appRole === "admin" ? (
          <OwnerWhatsappBrief />
        ) : null}
        <form action={signOut}>
          <button type="submit" className="sidebar-signout">
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
