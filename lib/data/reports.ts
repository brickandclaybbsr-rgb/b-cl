import { createClient } from "@/lib/supabase/server";
import { daysAgoIST, todayIST, datesDescending } from "@/lib/date";
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

export interface AttendanceStatusDay {
  date: string;
  openingFiled: boolean;
  closingFiled: boolean;
}

/** Whether the opening/closing checklist was filed on each day in the range. */
export async function getAttendanceStatusRange(from: string, to: string): Promise<AttendanceStatusDay[]> {
  const supabase = createClient();
  const [{ data: opening }, { data: closing }] = await Promise.all([
    supabase.from("opening_checklists").select("date").gte("date", from).lte("date", to),
    supabase.from("closing_checklists").select("date").gte("date", from).lte("date", to),
  ]);
  const openSet = new Set((opening ?? []).map((r: any) => r.date));
  const closeSet = new Set((closing ?? []).map((r: any) => r.date));

  const out: AttendanceStatusDay[] = [];
  for (const date of datesDescending(from, to)) {
    out.push({ date, openingFiled: openSet.has(date), closingFiled: closeSet.has(date) });
  }
  return out;
}

export interface LeaveInRange {
  profile_id: string;
  employeeName: string;
  leave_type: "cl" | "sl" | "lwp";
  start_date: string;
  end_date: string;
  status: string;
  reason: string;
}

/** Leave requests overlapping a date range, newest first, with employee names resolved. */
export async function getLeavesInRange(from: string, to: string): Promise<LeaveInRange[]> {
  const supabase = createClient();
  const [{ data: leaves }, { data: profiles }] = await Promise.all([
    supabase.from("leaves").select("*").lte("start_date", to).gte("end_date", from).order("start_date", { ascending: false }),
    supabase.from("profiles").select("id, name"),
  ]);
  const nameMap = new Map((profiles ?? []).map((p: any) => [p.id, p.name]));
  return (leaves ?? []).map((l: any) => ({
    profile_id: l.profile_id,
    employeeName: nameMap.get(l.profile_id) ?? "Unknown",
    leave_type: l.leave_type,
    start_date: l.start_date,
    end_date: l.end_date,
    status: l.status,
    reason: l.reason,
  }));
}

export interface ClosingBalanceDay {
  date: string;
  openingCash: number | null;
  openingDiscrepancy: number | null;
  openingDiscrepancyReason: string | null;
  closingCash: number | null;
  cashDeposited: number | null;
  closingDiscrepancyNotes: string | null;
  salesCash: number;
  cashOutTotal: number;
  cashOut: CashExpense[];
}

/**
 * Full closing-balance picture for one specific date: opening/closing cash
 * figures (from the front-desk checklist, which is the team that handles
 * cash), that day's cash sales, and every cash-out entry with its total.
 */
export async function getClosingBalanceForDate(date: string): Promise<ClosingBalanceDay> {
  const supabase = createClient();

  const [{ data: opening }, { data: closing }, sales, cashOut] = await Promise.all([
    supabase.from("opening_checklists").select("*").eq("date", date).eq("team", "front_desk").maybeSingle(),
    supabase.from("closing_checklists").select("*").eq("date", date).eq("team", "front_desk").maybeSingle(),
    getSalesRange(date, date),
    (async () => {
      const { data } = await supabase.from("cash_expenses").select("*").eq("date", date).order("submitted_at", { ascending: true });
      return (data ?? []) as CashExpense[];
    })(),
  ]);

  return {
    date,
    openingCash: opening?.opening_cash ?? null,
    openingDiscrepancy: opening?.cash_discrepancy ?? null,
    openingDiscrepancyReason: opening?.cash_discrepancy_reason ?? null,
    closingCash: closing?.closing_cash ?? null,
    cashDeposited: closing?.cash_deposited ?? null,
    closingDiscrepancyNotes: closing?.discrepancy_notes ?? null,
    salesCash: sales[0] ? Number(sales[0].cash_sales) : 0,
    cashOutTotal: cashOut.reduce((sum, e) => sum + Number(e.amount), 0),
    cashOut,
  };
}

/** Compact day-by-day closing-balance table for a date range, newest first. */
export async function getClosingBalanceRange(from: string, to: string): Promise<ClosingBalanceDay[]> {
  const supabase = createClient();

  const [{ data: openingRows }, { data: closingRows }, sales, { data: expenseRows }] = await Promise.all([
    supabase.from("opening_checklists").select("*").eq("team", "front_desk").gte("date", from).lte("date", to),
    supabase.from("closing_checklists").select("*").eq("team", "front_desk").gte("date", from).lte("date", to),
    getSalesRange(from, to),
    supabase.from("cash_expenses").select("*").gte("date", from).lte("date", to),
  ]);

  const openingByDate = new Map((openingRows ?? []).map((r: any) => [r.date, r]));
  const closingByDate = new Map((closingRows ?? []).map((r: any) => [r.date, r]));
  const salesByDate = new Map(sales.map((s) => [s.date, s]));
  const cashOutByDate = new Map<string, CashExpense[]>();
  for (const e of (expenseRows ?? []) as CashExpense[]) {
    if (!cashOutByDate.has(e.date)) cashOutByDate.set(e.date, []);
    cashOutByDate.get(e.date)!.push(e);
  }

  const out: ClosingBalanceDay[] = [];
  for (const date of datesDescending(from, to)) {
    const opening = openingByDate.get(date) as any;
    const closing = closingByDate.get(date) as any;
    const sale = salesByDate.get(date);
    const cashOut = cashOutByDate.get(date) ?? [];
    out.push({
      date,
      openingCash: opening?.opening_cash ?? null,
      openingDiscrepancy: opening?.cash_discrepancy ?? null,
      openingDiscrepancyReason: opening?.cash_discrepancy_reason ?? null,
      closingCash: closing?.closing_cash ?? null,
      cashDeposited: closing?.cash_deposited ?? null,
      closingDiscrepancyNotes: closing?.discrepancy_notes ?? null,
      salesCash: sale ? Number(sale.cash_sales) : 0,
      cashOutTotal: cashOut.reduce((sum, e) => sum + Number(e.amount), 0),
      cashOut,
    });
  }
  return out;
}
