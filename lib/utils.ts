import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind-aware className combiner. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as Indian Rupees, e.g. ₹1,23,456. */
export function formatINR(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}

/** Plain grouped number, e.g. 1,23,456 (no currency symbol). */
export function formatNumber(value: number | null | undefined): string {
  return new Intl.NumberFormat("en-IN").format(Number(value ?? 0));
}

/** Coerce a possibly-empty form value to a number (defaults to 0). */
export function toNumber(value: FormDataEntryValue | null): number {
  if (value === null) return 0;
  const n = parseFloat(String(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** Coerce a possibly-empty form value to an integer (defaults to 0). */
export function toInt(value: FormDataEntryValue | null): number {
  if (value === null) return 0;
  const n = parseInt(String(value).replace(/,/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

/** Initials from a name, e.g. "Ravi Kumar" → "RK". */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
