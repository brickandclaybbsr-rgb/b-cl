import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-bg-card/50 px-6 py-12 text-center",
        className,
      )}
    >
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-bg-elevated text-content-secondary">
        <Icon className="size-6" />
      </div>
      <p className="font-display text-base font-semibold text-content-primary">
        {title}
      </p>
      {description && (
        <p className="mt-1 max-w-xs text-sm text-content-secondary">
          {description}
        </p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
