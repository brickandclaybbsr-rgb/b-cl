"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import type { Role } from "@/lib/database.types";
import { BrandLogo } from "@/components/brand-logo";
import { SignOutButton } from "./sign-out-button";
import { Settings, QrCode } from "lucide-react";
import { OWNER_NAV, OWNER_MOBILE_NAV, STAFF_NAV, INVENTORY_MANAGER_NAV, isActive, type NavItem } from "./nav-config";
import { initials, cn } from "@/lib/utils";
import { hapticLight } from "@/lib/native";

export function AppShell({
  role,
  name,
  team,
  isHeadChef,
  children,
}: {
  role: Role;
  name: string;
  team: string | null;
  isHeadChef: boolean;
  children: React.ReactNode;
}) {
  if (role === "owner") return <OwnerShell name={name}>{children}</OwnerShell>;
  if (role === "inventory_manager") return <InventoryManagerShell name={name}>{children}</InventoryManagerShell>;
  return <StaffShell name={name} team={team} isHeadChef={isHeadChef}>{children}</StaffShell>;
}

/* ─────────────────────────── Owner ─────────────────────────── */

function OwnerShell({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div className="min-h-dvh md:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-bg-card/60 px-3 py-6 backdrop-blur md:flex">
        <div className="px-2.5 pb-1">
          <BrandLogo height={26} />
        </div>
        <nav className="mt-9 flex flex-1 flex-col gap-1">
          {OWNER_NAV.map((item) => (
            <SidebarLink key={item.label} item={item} active={isActive(item, pathname)} />
          ))}
        </nav>
        <UserChip name={name} role="Owner" />
      </aside>

      {/* Mobile: top bar with brand + settings icon + profile avatar */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-bg-primary/80 backdrop-blur-xl md:hidden pt-safe">
          <div className="flex items-center justify-between px-4 py-3">
            <BrandLogo height={22} />
            <div className="flex items-center gap-1.5">
              <Link
                href="/profile"
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg transition-all duration-200",
                  pathname === "/profile" || pathname.startsWith("/notifications")
                    ? "bg-white/15 text-white"
                    : "text-content-secondary hover:bg-white/10 hover:text-white"
                )}
                title="Settings"
              >
                <Settings className="size-4" />
              </Link>
              <Link
                href="/profile"
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-200",
                  pathname === "/profile"
                    ? "bg-white text-black ring-2 ring-white/30"
                    : "bg-white/10 text-white hover:bg-white/20"
                )}
                title={`${name} — Profile`}
              >
                {initials(name)}
              </Link>
              <SignOutButton label="" className="px-1.5" />
            </div>
          </div>
        </header>

        {/* pb-24 on mobile so content doesn't hide behind fixed bottom nav */}
        <main key={pathname} className="min-w-0 flex-1 animate-fade-in px-4 py-6 pb-24 md:px-9 md:py-9 md:pb-9">
          {children}
        </main>

        {/* Mobile fixed bottom nav — 5 items: Dashboard, Reports, Checklist, Store, Peoples */}
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg-card/90 pb-safe backdrop-blur-xl md:hidden">
          <div className="mx-auto grid max-w-2xl" style={{ gridTemplateColumns: `repeat(${OWNER_MOBILE_NAV.length}, minmax(0, 1fr))` }}>
            {OWNER_MOBILE_NAV.map((item) => {
              const active = isActive(item, pathname);
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => void hapticLight()}
                  className={cn(
                    "relative flex flex-col items-center gap-1 py-3 text-[0.65rem] font-medium transition-colors duration-200",
                    active ? "text-white" : "text-content-secondary",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0 h-0.5 w-8 rounded-full bg-white transition-all duration-300",
                      active ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <Icon
                    className={cn(
                      "size-5 transition-transform duration-200",
                      active && "-translate-y-px scale-105",
                    )}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

function SidebarLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        active
          ? "bg-white/[0.07] text-white"
          : "text-content-secondary hover:bg-white/[0.04] hover:text-content-primary",
      )}
    >
      <span
        className={cn(
          "absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-white transition-all duration-200",
          active ? "opacity-100" : "opacity-0",
        )}
      />
      <Icon className={cn("size-[18px] transition-transform group-hover:scale-110", active && "text-white")} />
      {item.label}
    </Link>
  );
}

function TabLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200",
        active
          ? "bg-white text-black"
          : "text-content-secondary hover:bg-bg-elevated hover:text-content-primary",
      )}
    >
      <Icon className="size-4" />
      {item.label}
    </Link>
  );
}

function UserChip({ name, role }: { name: string; role: string }) {
  return (
    <div className="mt-2 border-t border-border pt-3">
      <Link
        href="/profile"
        className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl transition-all duration-200 hover:bg-white/[0.04] hover:text-content-primary"
      >
        <div className="flex size-9 items-center justify-center rounded-full bg-white text-sm font-bold text-black">
          {initials(name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="text-xs text-content-secondary">{role}</p>
        </div>
      </Link>
      <SignOutButton className="mt-1 w-full" />
    </div>
  );
}

/* ─────────────────────── Inventory Manager ──────────────────── */

function InventoryManagerShell({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const nav = INVENTORY_MANAGER_NAV;

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Header: logo on left, name + role + sign-out on right */}
      <header className="sticky top-0 z-20 border-b border-border bg-bg-primary/80 backdrop-blur-xl pt-safe">
        <div className="container-app flex items-center justify-between py-3">
          <BrandLogo height={20} />

          <div className="flex items-center gap-2.5">
            {/* Avatar + name (name hidden on very small screens) */}
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-warm/20 text-xs font-bold text-warm select-none">
                {initials(name)}
              </div>
              <div className="hidden xs:block leading-tight text-right">
                <p className="text-xs font-semibold text-content-primary">{name}</p>
                <p className="text-[10px] text-content-secondary">Inventory Manager</p>
              </div>
            </div>
            <SignOutButton label="" className="px-1.5" />
          </div>
        </div>
      </header>

      {/* Page content — pb-24 clears the fixed bottom nav */}
      <main key={pathname} className="container-app flex-1 animate-fade-in pt-6 pb-24">
        {children}
      </main>

      {/* Bottom nav: Stock | Orders | Purchases — Suspense required for useSearchParams */}
      <Suspense fallback={<div className="fixed inset-x-0 bottom-0 h-16 border-t border-border bg-bg-card/90 pb-safe" />}>
        <InventoryManagerBottomNav items={nav} />
      </Suspense>
    </div>
  );
}

function InventoryManagerBottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");

  function isNavItemActive(item: NavItem): boolean {
    if (item.href === "/stock") return pathname === "/stock" || pathname.startsWith("/stock/");
    if (item.href.includes("tab=purchases")) return pathname === "/vendors" && tab === "purchases";
    if (item.href === "/vendors") return pathname === "/vendors" && tab !== "purchases";
    return isActive(item, pathname);
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg-card/90 pb-safe backdrop-blur-xl">
      <div
        className="mx-auto grid max-w-2xl"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const active = isNavItemActive(item);
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => void hapticLight()}
              className={cn(
                "relative flex flex-col items-center gap-1 py-3 text-[0.7rem] font-medium transition-colors duration-200",
                active ? "text-white" : "text-content-secondary",
              )}
            >
              <span
                className={cn(
                  "absolute top-0 h-0.5 w-8 rounded-full bg-white transition-all duration-300",
                  active ? "opacity-100" : "opacity-0",
                )}
              />
              <Icon
                className={cn(
                  "size-5 transition-transform duration-200",
                  active && "-translate-y-px scale-105",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/* ─────────────────────────── Staff ─────────────────────────── */

function StaffShell({
  name,
  team,
  isHeadChef,
  children,
}: {
  name: string;
  team: string | null;
  isHeadChef: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const nav = STAFF_NAV;
  // Split the 4 destinations around the centred QR button: 2 left, 2 right.
  const leftNav = nav.slice(0, 2);
  const rightNav = nav.slice(2, 4);
  const profileActive = pathname === "/profile" || pathname.startsWith("/notifications");
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-bg-primary/80 backdrop-blur-xl pt-safe">
        <div className="container-app flex items-center justify-between py-3.5">
          <BrandLogo height={20} />
          <div className="flex items-center gap-1.5">
            <Link
              href="/profile"
              className={cn(
                "flex size-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-200",
                profileActive
                  ? "bg-white text-black ring-2 ring-white/30"
                  : "bg-white/10 text-white hover:bg-white/20",
              )}
              title={`${name} — Profile`}
            >
              {initials(name)}
            </Link>
            <SignOutButton label="" className="px-1.5" />
          </div>
        </div>
      </header>

      <main key={pathname} className="container-app flex-1 animate-fade-in pb-24 pt-6">
        {children}
      </main>

      {/* Bottom navigation — 2 tabs, centred QR scan button, 2 tabs */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg-card/90 pb-safe backdrop-blur-xl">
        <div className="mx-auto grid max-w-2xl grid-cols-5 items-end">
          {leftNav.map((item) => (
            <BottomTab key={item.label} item={item} active={isActive(item, pathname)} />
          ))}

          {/* Centre QR scan button (raised) */}
          <div className="flex justify-center">
            <Link
              href="/attendance/checkin"
              onClick={() => void hapticLight()}
              title="Scan QR"
              className={cn(
                "-mt-6 flex size-14 flex-col items-center justify-center rounded-full bg-fire text-white shadow-lg shadow-fire/30 ring-4 ring-bg-card transition-transform duration-200 active:scale-95",
                pathname.startsWith("/attendance/checkin") && "scale-105",
              )}
            >
              <QrCode className="size-6" />
            </Link>
          </div>

          {rightNav.map((item) => (
            <BottomTab key={item.label} item={item} active={isActive(item, pathname)} />
          ))}
        </div>
      </nav>
    </div>
  );
}

function BottomTab({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={() => void hapticLight()}
      className={cn(
        "relative flex flex-col items-center gap-1 py-3 text-[0.7rem] font-medium transition-colors duration-200",
        active ? "text-white" : "text-content-secondary",
      )}
    >
      <span
        className={cn(
          "absolute top-0 h-0.5 w-8 rounded-full bg-white transition-all duration-300",
          active ? "opacity-100" : "opacity-0",
        )}
      />
      <Icon className={cn("size-5 transition-transform duration-200", active && "-translate-y-px scale-105")} />
      {item.label}
    </Link>
  );
}
