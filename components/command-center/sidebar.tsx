"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  commandNavItems,
  getActiveNavId,
} from "@/lib/command-center/navigation";
import { OwnerWhatsappBrief } from "@/components/command-center/owner-whatsapp-brief";

export function CommandSidebar() {
  const pathname = usePathname();
  const activeId = getActiveNavId(pathname);

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
        {commandNavItems.map((item) => {
          const isActive = item.id === activeId;
          return (
            <Link
              key={item.id}
              href={item.href}
              prefetch
              className={isActive ? "nav-item active" : "nav-item"}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <OwnerWhatsappBrief />
    </aside>
  );
}
