"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { IndianRupee, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { tab: "",         href: "/sales",             label: "Sales",    icon: IndianRupee },
  { tab: "expenses", href: "/sales?tab=expenses", label: "Expenses", icon: Receipt },
];

export function SalesTabs() {
  const searchParams = useSearchParams();
  const active = searchParams.get("tab") ?? "";

  return (
    <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl border border-border bg-bg-card p-1">
      {tabs.map((t) => {
        const isActive = active === t.tab;
        const Icon = t.icon;
        return (
          <Link
            key={t.tab}
            href={t.href}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors",
              isActive
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
