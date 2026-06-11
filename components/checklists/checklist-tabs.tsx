"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sunrise, Sunset } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/checklist/opening", label: "Opening", icon: Sunrise },
  { href: "/checklist/closing", label: "Closing", icon: Sunset },
];

export function ChecklistTabs() {
  const pathname = usePathname();
  return (
    <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl border border-border bg-bg-card p-1">
      {tabs.map((t) => {
        const active = pathname === t.href;
        const Icon = t.icon;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors",
              active
                ? "bg-bg-elevated text-warm shadow-sm"
                : "text-content-secondary hover:text-content-primary",
            )}
          >
            <Icon className="size-4" />
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
