import * as React from "react";
import { cn } from "@/lib/utils";

export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl border border-border bg-bg-card shadow-card transition-all duration-200",
      "[box-shadow:inset_0_1px_0_rgba(255,255,255,0.04),0_8px_30px_-24px_rgba(0,0,0,0.9)]",
      className,
    )}
    {...props}
  />
));
Card.displayName = "Card";

export const CardHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col gap-1 p-5 pb-3", className)} {...props} />
);

export const CardTitle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={cn("font-display text-lg font-semibold tracking-tight", className)}
    {...props}
  />
);

export const CardDescription = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-content-secondary", className)} {...props} />
);

export const CardContent = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-5 pt-0", className)} {...props} />
);

export const CardFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex items-center gap-3 p-5 pt-0", className)} {...props} />
);
