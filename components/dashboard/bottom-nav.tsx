"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconBookings,
  IconHome,
  IconMenu,
  IconPayments,
} from "@/components/dashboard/icons";

const navItems = [
  { href: "/dashboard", label: "Home", icon: IconHome, exact: true },
  {
    href: "/dashboard/bookings",
    label: "Bookings",
    icon: IconBookings,
    exact: false,
  },
  {
    href: "/dashboard/payments",
    label: "Payments",
    icon: IconPayments,
    exact: false,
  },
  { href: "/dashboard/more", label: "More", icon: IconMenu, exact: false },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex h-14 max-w-lg items-center justify-around px-2">
        {navItems.map(({ href, label, icon: NavIcon, exact }) => {
          const isActive = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[11px] font-medium transition ${
                isActive ? "text-accent" : "text-muted"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center [&>svg]:!h-[22px] [&>svg]:!w-[22px] ${
                  isActive ? "text-accent" : "text-muted"
                }`}
              >
                <NavIcon size={22} />
              </span>
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
