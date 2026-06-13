import {
  Home,
  ClipboardCheck,
  IndianRupee,
  Package,
  ShoppingCart,
  LayoutDashboard,
  LineChart,
  Settings,
  Receipt,
  Calendar,
  Users,
  Bell,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Extra prefixes that should also mark this item active. */
  match?: string[];
}

export const STAFF_NAV: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: Home },
  {
    label: "Checklist",
    href: "/checklist/opening",
    icon: ClipboardCheck,
    match: ["/checklist"],
  },
  { label: "Sales", href: "/sales", icon: IndianRupee },
  { label: "Stock", href: "/stock", icon: Package },
  { label: "Orders", href: "/vendors", icon: ShoppingCart },
  { label: "Reimburse", href: "/reimbursements", icon: Receipt },
];

export const OWNER_NAV: NavItem[] = [
  { label: "Dashboard", href: "/owner", icon: LayoutDashboard },
  { label: "Reports", href: "/reports", icon: LineChart },
  { label: "Stock", href: "/stock", icon: Package },
  { label: "Vendors", href: "/vendors", icon: ShoppingCart },
  { label: "Peoples", href: "/attendance", icon: Users, match: ["/attendance", "/reimbursements"] },
  { label: "Notify", href: "/notifications", icon: Bell },
];

export function isActive(item: NavItem, pathname: string): boolean {
  if (pathname === item.href) return true;
  const prefixes = item.match ?? [item.href];
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
}
