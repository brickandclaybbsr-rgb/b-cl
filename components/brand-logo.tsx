import { cn } from "@/lib/utils";

/** Full horizontal lockup (oven mark + "BRICK AND CLAY / WOOD FIRE ITALIAN PIZZA"). */
export function BrandLogo({
  className,
  height = 30,
}: {
  className?: string;
  height?: number;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/logo-full.png"
      alt="Brick & Clay — Wood Fire Italian Pizza"
      style={{ height }}
      className={cn("w-auto select-none", className)}
      draggable={false}
    />
  );
}

/** Square "B&CL" monogram badge. */
export function BrandMark({
  className,
  size = 34,
}: {
  className?: string;
  size?: number;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/logo-mark.png"
      alt="B&CL"
      style={{ height: size }}
      className={cn("w-auto select-none", className)}
      draggable={false}
    />
  );
}

// Back-compat alias for older imports.
export const FlameMark = BrandMark;
