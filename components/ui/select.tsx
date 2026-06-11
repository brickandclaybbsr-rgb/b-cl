import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Native select styled to match the dark theme (reliable on mobile). */
export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(
        "flex h-11 w-full appearance-none rounded-xl border border-border bg-bg-elevated px-3.5 pr-10 text-sm text-content-primary",
        "focus-visible:border-fire/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fire/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-content-secondary" />
  </div>
));
Select.displayName = "Select";
