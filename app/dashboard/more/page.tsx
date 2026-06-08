import Link from "next/link";
import { signOut } from "@/lib/auth/actions";
import { getUserMembership } from "@/lib/auth/membership";
import { getNavItemsForRole } from "@/lib/command-center/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function MorePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const membership = await getUserMembership();
  const appRole = membership?.appRole ?? "owner";

  const extraNav = getNavItemsForRole(appRole).filter(
    (item) => !item.mobile && item.id !== "today"
  );

  return (
    <div className="view-stack">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Account</p>
            <h2>More</h2>
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
              className="appointment-row"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <span className="appointment-time">→</span>
              <div>
                <strong>{item.label}</strong>
              </div>
            </Link>
          ))}
        </div>
        <form action={signOut} style={{ marginTop: 18 }}>
          <button type="submit" className="primary-button" style={{ width: "100%" }}>
            Sign out
          </button>
        </form>
      </section>
    </div>
  );
}
