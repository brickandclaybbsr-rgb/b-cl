"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import { setActiveOutlet } from "@/app/(app)/outlet-actions";
import type { OutletOption } from "@/lib/data/outlets";

/**
 * Saheed Nagar | Patia toggle for the owner; a plain outlet badge for staff.
 * The owner's choice is remembered server-side, so every daily-records screen
 * (dashboard, sales, cash out, checklists, closing balance) follows it.
 */
export function OutletSwitcher({
  outlets,
  activeId,
  canSwitch,
  className = "mb-4",
}: {
  outlets: OutletOption[];
  activeId: string;
  canSwitch: boolean;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  if (outlets.length < 2) return null;
  const active = outlets.find((o) => o.id === activeId);

  if (!canSwitch) {
    return (
      <div className={className}>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-elevated px-3 py-1 text-xs font-semibold text-content-primary">
          <MapPin className="size-3 text-warm" />
          {active?.name ?? "Outlet"}
        </span>
      </div>
    );
  }

  const choose = (id: string) => {
    if (id === activeId || pending) return;
    startTransition(async () => {
      const res = await setActiveOutlet(id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      // An ?outlet= in the URL outranks the remembered choice — drop it.
      const params = new URLSearchParams(searchParams.toString());
      params.delete("outlet");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      router.refresh();
    });
  };

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label="Outlet"
        className={`inline-flex rounded-lg border border-border bg-bg-elevated p-1 text-xs ${pending ? "opacity-60" : ""}`}
      >
        {outlets.map((o) => {
          const isActive = o.id === activeId;
          return (
            <button
              key={o.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              disabled={pending}
              onClick={() => choose(o.id)}
              className={`flex items-center gap-1 rounded-md px-3 py-1 font-semibold transition-colors ${
                isActive ? "bg-warm text-bg-base shadow-sm" : "text-content-secondary hover:text-content-primary"
              }`}
            >
              {isActive && <MapPin className="size-3" />}
              {o.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
