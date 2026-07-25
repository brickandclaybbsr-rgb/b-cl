import {
  Home,
  ClipboardCheck,
  IndianRupee,
  Package,
  ShoppingCart,
  LayoutDashboard,
  LineChart,
  Settings,
  Calendar,
  Users,
  Bell,
  Wallet,
  Receipt,
  MapPin,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Extra prefixes that should also mark this item active. */
  match?: string[];
}

// Staff bottom bar destinations. Profile lives in the header top-right; the QR
// scan button is rendered as a raised button in the centre of the bottom bar.
export const STAFF_NAV: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: Home },
  {
    label: "Checklist",
    href: "/checklist/opening",
    icon: ClipboardCheck,
    match: ["/checklist"],
  },
  { label: "Sales", href: "/sales", icon: IndianRupee },
  { label: "Store", href: "/stock", icon: Package, match: ["/stock", "/vendors"] },
];

export const OWNER_NAV: NavItem[] = [
  { label: "Dashboard", href: "/owner", icon: LayoutDashboard },
  { label: "Reports", href: "/reports", icon: LineChart },
  { label: "Checklist", href: "/checklist/opening", icon: ClipboardCheck, match: ["/checklist"] },
  { label: "Stock", href: "/stock", icon: Package },
  { label: "Vendors", href: "/vendors", icon: ShoppingCart },
  { label: "Peoples", href: "/attendance", icon: Users, match: ["/attendance", "/reimbursements"] },
  { label: "Outlets", href: "/owner/outlets", icon: MapPin },
  { label: "Settings", href: "/profile", icon: Settings, match: ["/profile", "/notifications"] },
];

/** Inventory manager: stock, orders, and purchases. */
export const INVENTORY_MANAGER_NAV: NavItem[] = [
  { label: "Stock", href: "/stock", icon: Package },
  { label: "Orders", href: "/vendors", icon: ShoppingCart },
  { label: "Purchases", href: "/vendors?tab=purchases", icon: Receipt },
];

/** Condensed nav for the mobile bottom bar — 4 items only. */
export const OWNER_MOBILE_NAV: NavItem[] = [
  { label: "Dashboard", href: "/owner", icon: LayoutDashboard },
  { label: "Reports", href: "/reports", icon: LineChart, match: ["/reports", "/checklist"] },
  { label: "Store", href: "/vendors", icon: ShoppingCart, match: ["/vendors", "/stock"] },
  { label: "Peoples", href: "/attendance", icon: Users, match: ["/attendance", "/reimbursements"] },
];

export function isActive(item: NavItem, pathname: string): boolean {
  if (pathname === item.href) return true;
  const prefixes = item.match ?? [item.href];
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
}
