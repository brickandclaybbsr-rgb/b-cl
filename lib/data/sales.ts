import { createClient } from "@/lib/supabase/server";
import { daysAgoIST, todayIST, formatShortDate } from "@/lib/date";
import type { DailySales } from "@/lib/database.types";

export function salesTotal(s: Pick<DailySales, "cash_sales" | "online_sales" | "aggregator_sales">) {
  return Number(s.cash_sales) + Number(s.online_sales) + Number(s.aggregator_sales);
}

export async function getSales(date: string): Promise<DailySales | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("daily_sales")
    .select("*")
    .eq("date", date)
    .maybeSingle();
  return data ?? null;
}

/** Sales rows between two dates (inclusive), oldest first — for trend charts. */
export async function getSalesRange(
  from: string,
  to: string,
): Promise<DailySales[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("daily_sales")
    .select("*")
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: true });
  return data ?? [];
}

export interface TrendDay {
  date: string;
  label: string;
  cash: number;
  online: number;
  aggregator: number;
  total: number;
}

/** Last `days` days of sales, with zero-filled gaps, oldest → newest. */
export async function getSalesTrend(days = 7): Promise<TrendDay[]> {
  const from = daysAgoIST(days - 1);
  const to = todayIST();
  const rows = await getSalesRange(from, to);
  const byDate = new Map(rows.map((r) => [r.date, r]));

  const out: TrendDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = daysAgoIST(i);
    const r = byDate.get(date);
    out.push({
      date,
      label: formatShortDate(date),
      cash: Number(r?.cash_sales ?? 0),
      online: Number(r?.online_sales ?? 0),
      aggregator: Number(r?.aggregator_sales ?? 0),
      total: r ? salesTotal(r) : 0,
    });
  }
  return out;
}
