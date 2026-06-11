import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "default",
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  hint?: React.ReactNode;
  tone?: "default" | "fire" | "success" | "warning" | "danger";
  className?: string;
}) {
  const toneClass = {
    default: "text-content-primary",
    fire: "text-warm",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
  }[tone];

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-content-secondary">
          {label}
        </p>
        {Icon && <Icon className={cn("size-4", toneClass)} />}
      </div>
      <p className={cn("mt-2 font-mono text-2xl font-bold tabular-nums", toneClass)}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-content-secondary">{hint}</p>}
    </Card>
  );
}
