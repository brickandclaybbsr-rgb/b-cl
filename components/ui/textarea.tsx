import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[84px] w-full rounded-xl border border-border bg-bg-elevated px-3.5 py-2.5 text-sm text-content-primary",
      "placeholder:text-content-secondary/60",
      "focus-visible:border-fire/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fire/30",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
