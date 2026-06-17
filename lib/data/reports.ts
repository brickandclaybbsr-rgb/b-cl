import { createClient } from "@/lib/supabase/server";
import { daysAgoIST, todayIST } from "@/lib/date";
import { getSalesRange, salesTotal } from "@/lib/data/sales";
import type { EodReport, DailySales, CashExpense } from "@/lib/database.types";

export interface DaySummary {
  date: string;
  total: number;
  cash: number;
  online: number;
  aggregator: number;
  hasSales: boolean;
  openingDone: boolean;
  closingDone: boolean;
  sales: DailySales | null;
  cashOut: CashExpense[];
  cashOutTotal: number;
}

/** Per-day operational summary for the last `days` days, newest first. */
export async function getRecentDays(days = 14): Promise<DaySummary[]> {
  const supabase = createClient();
  const from = daysAgoIST(days - 1);
  const to = todayIST();

  const [sales, opening, closing, expenses] = await Promise.all([
    getSalesRange(from, to),
    supabase.from("opening_checklists").select("date").gte("date", from).lte("date", to),
    supabase.from("closing_checklists").select("date").gte("date", from).lte("date", to),
    supabase.from("cash_expenses").select("*").gte("date", from).lte("date", to).order("submitted_at", { ascending: true }),
  ]);

  const salesByDate = new Map(sales.map((s) => [s.date, s]));
  const openSet = new Set((opening.data ?? []).map((r) => r.date));
  const closeSet = new Set((closing.data ?? []).map((r) => r.date));

  // Group cash expenses by date
  const cashByDate = new Map<string, CashExpense[]>();
  for (const e of (expenses.data ?? []) as CashExpense[]) {
    if (!cashByDate.has(e.date)) cashByDate.set(e.date, []);
    cashByDate.get(e.date)!.push(e);
  }

  const out: DaySummary[] = [];
  for (let i = 0; i < days; i++) {
    const date = daysAgoIST(i);
    const s = salesByDate.get(date);
    const cashOut = cashByDate.get(date) ?? [];
    out.push({
      date,
      total: s ? salesTotal(s) : 0,
      cash: Number(s?.cash_sales ?? 0),
      online: Number(s?.online_sales ?? 0),
      aggregator: Number(s?.aggregator_sales ?? 0),
      hasSales: !!s,
      openingDone: openSet.has(date),
      closingDone: closeSet.has(date),
      sales: s ?? null,
      cashOut,
      cashOutTotal: cashOut.reduce((sum, e) => sum + Number(e.amount), 0),
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
