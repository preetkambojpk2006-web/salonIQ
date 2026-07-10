import { cookies } from "next/headers";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { getCachedAuthUser } from "@/lib/auth/cached-server";
import { getUserMembership } from "@/lib/auth/membership";
import { getNavItemsForRole } from "@/lib/command-center/navigation";
import { getLocale, t } from "@/lib/i18n";

export default async function MorePage() {
  const user = await getCachedAuthUser();
  const membership = await getUserMembership();
  const appRole = membership?.appRole ?? "staff";
  const locale = getLocale(cookies().get("saloniq_ui_language")?.value);

  const extraNav = getNavItemsForRole(appRole).filter(
    (item) => !item.mobile && item.id !== "today"
  );

  return (
    <div className="view-stack">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">{t("more.account", locale)}</p>
            <h2>{t("nav.more", locale)}</h2>
          </div>
        </div>
        <p className="text-body" style={{ marginBottom: 16 }}>
          {user?.email}
        </p>
        <div className="appointment-list">
          {extraNav.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              prefetch
              className="appointment-row"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <span className="appointment-time">→</span>
              <div>
                <strong>{t(`nav.${item.id}`, locale)}</strong>
              </div>
            </Link>
          ))}
        </div>
        <LogoutButton className="sidebar-logout more-logout" />
      </section>
    </div>
  );
}
