import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    ref={ref}
    className={cn(
      "flex h-11 w-full rounded-xl border border-border bg-bg-elevated text-content-primary transition-all duration-200",
      type === "file"
        ? "p-1.5 text-xs text-content-secondary file:mr-3 file:h-full file:rounded-lg file:border-0 file:bg-white/10 file:text-white file:px-3 file:text-xs file:font-semibold hover:file:bg-white/15 file:transition-all file:duration-200 file:cursor-pointer cursor-pointer"
        : "px-3.5 text-sm",
      "placeholder:text-content-secondary/60",
      "focus-visible:border-fire/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fire/30",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
