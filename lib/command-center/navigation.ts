export type CommandNavId =
  | "today"
  | "receptionist"
  | "calendar"
  | "customers"
  | "money"
  | "insights"
  | "automations"
  | "coach"
  | "branches"
  | "settings";

export type CommandNavItem = {
  id: CommandNavId;
  label: string;
  href: string;
  /** Mobile bottom nav only */
  mobile?: boolean;
};

export const commandNavItems: CommandNavItem[] = [
  { id: "today", label: "Today", href: "/dashboard", mobile: true },
  {
    id: "receptionist",
    label: "AI Receptionist",
    href: "/dashboard/receptionist",
  },
  { id: "calendar", label: "Calendar", href: "/dashboard/calendar", mobile: true },
  { id: "customers", label: "Customers", href: "/dashboard/customers", mobile: true },
  { id: "money", label: "Money", href: "/dashboard/money", mobile: true },
  { id: "insights", label: "Insights", href: "/dashboard/insights" },
  { id: "automations", label: "Automations", href: "/dashboard/automations" },
  { id: "coach", label: "AI Coach", href: "/dashboard/coach" },
  { id: "branches", label: "Branches", href: "/dashboard/branches" },
  { id: "settings", label: "Settings", href: "/dashboard/settings" },
];

export const mobileNavItems = commandNavItems.filter((item) => item.mobile);

export const moreNavItems = commandNavItems.filter((item) => !item.mobile);

export function getActiveNavId(pathname: string): CommandNavId {
  if (pathname === "/dashboard") return "today";
  if (pathname.startsWith("/dashboard/receptionist")) return "receptionist";
  if (pathname.startsWith("/dashboard/calendar")) return "calendar";
  if (pathname.startsWith("/dashboard/customers")) return "customers";
  if (pathname.startsWith("/dashboard/money")) return "money";
  if (pathname.startsWith("/dashboard/insights")) return "insights";
  if (pathname.startsWith("/dashboard/automations")) return "automations";
  if (pathname.startsWith("/dashboard/coach")) return "coach";
  if (pathname.startsWith("/dashboard/branches")) return "branches";
  if (pathname.startsWith("/dashboard/settings")) return "settings";
  return "today";
}
