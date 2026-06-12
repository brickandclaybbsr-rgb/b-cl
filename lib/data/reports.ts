import { createClient } from "@/lib/supabase/server";
import { daysAgoIST, todayIST } from "@/lib/date";
import { getSalesRange, salesTotal } from "@/lib/data/sales";
import type { EodReport } from "@/lib/database.types";

export interface DaySummary {
  date: string;
  total: number;
  cash: number;
  online: number;
  aggregator: number;
  hasSales: boolean;
  openingDone: boolean;
  closingDone: boolean;
}

/** Per-day operational summary for the last `days` days, newest first. */
export async function getRecentDays(days = 14): Promise<DaySummary[]> {
  const supabase = createClient();
  const from = daysAgoIST(days - 1);
  const to = todayIST();

  const [sales, opening, closing] = await Promise.all([
    getSalesRange(from, to),
    supabase.from("opening_checklists").select("date").gte("date", from).lte("date", to),
    supabase.from("closing_checklists").select("date").gte("date", from).lte("date", to),
  ]);

  const salesByDate = new Map(sales.map((s) => [s.date, s]));
  const openSet = new Set((opening.data ?? []).map((r) => r.date));
  const closeSet = new Set((closing.data ?? []).map((r) => r.date));

  const out: DaySummary[] = [];
  for (let i = 0; i < days; i++) {
    const date = daysAgoIST(i);
    const s = salesByDate.get(date);
    out.push({
      date,
      total: s ? salesTotal(s) : 0,
      cash: Number(s?.cash_sales ?? 0),
      online: Number(s?.online_sales ?? 0),
      aggregator: Number(s?.aggregator_sales ?? 0),
      hasSales: !!s,
      openingDone: openSet.has(date),
      closingDone: closeSet.has(date),
    });
  }
  return out;
}

export async function getEodLog(limit = 14): Promise<EodReport[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("eod_reports")
    .select("*")
    .order("sent_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}
