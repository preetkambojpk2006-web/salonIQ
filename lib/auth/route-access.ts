import type { AppRole } from "@/lib/auth/membership";
import type { CommandNavId } from "@/lib/command-center/navigation";

const STAFF_BLOCKED_PATHS = [
  "/dashboard/money",
  "/dashboard/attendance",
  "/dashboard/insights",
  "/dashboard/automations",
  "/dashboard/coach",
  "/dashboard/branches",
  "/dashboard/services",
  "/dashboard/settings",
] as const;

const FINANCE_NAV_IDS = new Set<CommandNavId>([
  "money",
  "attendance",
  "insights",
  "automations",
  "coach",
  "branches",
  "services",
  "settings",
]);

export function isStaffBlockedPath(pathname: string): boolean {
  return STAFF_BLOCKED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export function canAccessNavItem(role: AppRole, navId: CommandNavId): boolean {
  if (role === "staff" && FINANCE_NAV_IDS.has(navId)) {
    return false;
  }
  return true;
}

export function canAccessDashboardPath(role: AppRole, pathname: string): boolean {
  if (role !== "staff") {
    return true;
  }
  return !isStaffBlockedPath(pathname);
}
