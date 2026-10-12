import { createClient } from "@/lib/supabase/server";
import { daysAgoIST, todayIST, formatShortDate } from "@/lib/date";
import { outletRecordsStart } from "@/lib/constants";
import type { DailySales } from "@/lib/database.types";

export function salesTotal(s: Pick<DailySales, "cash_sales" | "online_sales" | "aggregator_sales">) {
  return Number(s.cash_sales) + Number(s.online_sales) + Number(s.aggregator_sales);
}

export async function getSales(date: string, outletId?: string | null): Promise<DailySales | null> {
  const supabase = createClient();
  let q = supabase.from("daily_sales").select("*").eq("date", date);
  if (outletId) {
    q = q.eq("outlet_id", outletId);
    const { data } = await q.maybeSingle();
    return (data as DailySales | null) ?? null;
  }
  const { data } = await q.order("submitted_at", { ascending: false }).limit(1);
  return (data as DailySales[] | null)?.[0] ?? null;
}

/** Returns all sales records across outlets for a specific date */
export async function getSalesForDate(date: string): Promise<DailySales[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("daily_sales")
    .select("*")
    .eq("date", date)
    .order("submitted_at", { ascending: true });
  return (data as DailySales[] | null) ?? [];
}

/** Sales rows between two dates (inclusive), oldest first — for trend charts. */
export async function getSalesRange(
  from: string,
  to: string,
  outletId?: string | null,
): Promise<DailySales[]> {
  const supabase = createClient();
  let q = supabase
    .from("daily_sales")
    .select("*")
    .gte("date", from)
    .lte("date", to);
  if (outletId) q = q.eq("outlet_id", outletId);
  const { data } = await q.order("date", { ascending: true });
  return (data as DailySales[] | null) ?? [];
}

export interface TrendDay {
  date: string;
  label: string;
  cash: number;
  online: number;
  aggregator: number;
  total: number;
}

/**
 * Last `days` days of sales, with zero-filled gaps, oldest → newest. For one
 * outlet when `outletId` is given (skipping days before its records start);
 * otherwise every outlet's figures for a day are added together.
 */
export async function getSalesTrend(days = 7, outletId?: string | null): Promise<TrendDay[]> {
  const from = daysAgoIST(days - 1);
  const to = todayIST();
  const rows = await getSalesRange(from, to, outletId);
  const byDate = new Map<string, { cash: number; online: number; aggregator: number }>();
  for (const r of rows) {
    const d = byDate.get(r.date) ?? { cash: 0, online: 0, aggregator: 0 };
    d.cash += Number(r.cash_sales);
    d.online += Number(r.online_sales);
    d.aggregator += Number(r.aggregator_sales);
    byDate.set(r.date, d);
  }

  const start = outletRecordsStart(outletId);
  const out: TrendDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = daysAgoIST(i);
    if (date < start) continue;
    const d = byDate.get(date) ?? { cash: 0, online: 0, aggregator: 0 };
    out.push({ date, label: formatShortDate(date), ...d, total: d.cash + d.online + d.aggregator });
  }
  return out;
}

/**
 * Dates with no sales filed for an outlet, oldest first, up to (not
 * including) `today`. Counted from the outlet's records start
 * (outletRecordsStart), so an outlet that opened later isn't shown months of
 * "missing" days from before its books began.
 */
export async function getMissingSalesDates(outletId: string, from: string, today: string): Promise<string[]> {
  const start = from > outletRecordsStart(outletId) ? from : outletRecordsStart(outletId);
  if (start >= today) return [];
  const rows = await getSalesRange(start, today, outletId);
  const filed = new Set(rows.map((r) => r.date));
  const missing: string[] = [];
  for (let d = new Date(start + "T00:00:00Z"); ; d.setUTCDate(d.getUTCDate() + 1)) {
    const str = d.toISOString().slice(0, 10);
    if (str >= today) break; // today can still be filed tonight
    if (!filed.has(str)) missing.push(str);
  }
  return missing;
}
