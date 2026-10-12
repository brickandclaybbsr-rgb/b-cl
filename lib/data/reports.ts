import { createClient } from "@/lib/supabase/server";
import { daysAgoIST, todayIST, datesDescending } from "@/lib/date";
import { getSalesRange, salesTotal } from "@/lib/data/sales";
import { outletRecordsStart } from "@/lib/constants";
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

/**
 * Per-day operational summary for the last `days` days, newest first — for one
 * outlet, or every outlet added together when `outletId` is omitted.
 */
export async function getRecentDays(days = 14, outletId?: string | null): Promise<DaySummary[]> {
  const supabase = createClient();
  const from = daysAgoIST(days - 1);
  const to = todayIST();

  let opening = supabase.from("opening_checklists").select("date").gte("date", from).lte("date", to);
  let closing = supabase.from("closing_checklists").select("date").gte("date", from).lte("date", to);
  let expenses = supabase.from("cash_expenses").select("*").gte("date", from).lte("date", to);
  if (outletId) {
    opening = opening.eq("outlet_id", outletId);
    closing = closing.eq("outlet_id", outletId);
    expenses = expenses.eq("outlet_id", outletId);
  }

  const [sales, openingRes, closingRes, expensesRes] = await Promise.all([
    getSalesRange(from, to, outletId),
    opening,
    closing,
    expenses.order("submitted_at", { ascending: true }),
  ]);

  const salesByDate = sumSalesByDate(sales);
  const openSet = new Set((openingRes.data ?? []).map((r) => r.date));
  const closeSet = new Set((closingRes.data ?? []).map((r) => r.date));
  const cashByDate = groupByDate((expensesRes.data ?? []) as CashExpense[]);

  const start = outletRecordsStart(outletId);
  const out: DaySummary[] = [];
  for (let i = 0; i < days; i++) {
    const date = daysAgoIST(i);
    if (date < start) break; // newest first — everything older is before the outlet's records
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
export async function getAttendanceStatusRange(
  from: string,
  to: string,
  outletId?: string | null,
): Promise<AttendanceStatusDay[]> {
  const supabase = createClient();
  let opening = supabase.from("opening_checklists").select("date").gte("date", from).lte("date", to);
  let closing = supabase.from("closing_checklists").select("date").gte("date", from).lte("date", to);
  if (outletId) {
    opening = opening.eq("outlet_id", outletId);
    closing = closing.eq("outlet_id", outletId);
  }
  const [{ data: openingRows }, { data: closingRows }] = await Promise.all([opening, closing]);
  const openSet = new Set((openingRows ?? []).map((r: any) => r.date));
  const closeSet = new Set((closingRows ?? []).map((r: any) => r.date));

  const start = outletRecordsStart(outletId);
  const out: AttendanceStatusDay[] = [];
  for (const date of datesDescending(from, to)) {
    if (date < start) break;
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
 * cash), that day's cash sales, and every cash-out entry with its total. For
 * one outlet, or every outlet added together when `outletId` is omitted.
 */
export async function getClosingBalanceForDate(date: string, outletId?: string | null): Promise<ClosingBalanceDay> {
  const [day] = await getClosingBalanceRange(date, date, outletId);
  // Before the outlet's records start there is nothing to show — not even zeros.
  return day ?? {
    date, openingCash: null, openingDiscrepancy: null, openingDiscrepancyReason: null,
    closingCash: null, cashDeposited: null, closingDiscrepancyNotes: null,
    salesCash: 0, cashOutTotal: 0, cashOut: [],
  };
}

/**
 * Compact day-by-day closing-balance table for a date range, newest first,
 * starting no earlier than the outlet's records start. With no `outletId`,
 * each day's figures are the sum across outlets (a figure stays null only
 * when no outlet recorded it).
 */
export async function getClosingBalanceRange(
  rangeFrom: string,
  to: string,
  outletId?: string | null,
): Promise<ClosingBalanceDay[]> {
  const from = rangeFrom > outletRecordsStart(outletId) ? rangeFrom : outletRecordsStart(outletId);
  if (from > to) return [];
  const supabase = createClient();
  let opening = supabase.from("opening_checklists").select("*").eq("team", "front_desk").gte("date", from).lte("date", to);
  let closing = supabase.from("closing_checklists").select("*").eq("team", "front_desk").gte("date", from).lte("date", to);
  let expenses = supabase.from("cash_expenses").select("*").gte("date", from).lte("date", to);
  if (outletId) {
    opening = opening.eq("outlet_id", outletId);
    closing = closing.eq("outlet_id", outletId);
    expenses = expenses.eq("outlet_id", outletId);
  }

  const [{ data: openingRows }, { data: closingRows }, sales, { data: expenseRows }] = await Promise.all([
    opening,
    closing,
    getSalesRange(from, to, outletId),
    expenses.order("submitted_at", { ascending: true }),
  ]);

  const openingByDate = groupByDate((openingRows ?? []) as any[]);
  const closingByDate = groupByDate((closingRows ?? []) as any[]);
  const salesByDate = sumSalesByDate(sales);
  const cashOutByDate = groupByDate((expenseRows ?? []) as CashExpense[]);

  const out: ClosingBalanceDay[] = [];
  for (const date of datesDescending(from, to)) {
    const opens = openingByDate.get(date) ?? [];
    const closes = closingByDate.get(date) ?? [];
    const sale = salesByDate.get(date);
    const cashOut = cashOutByDate.get(date) ?? [];
    out.push({
      date,
      openingCash: sumOrNull(opens.map((r) => r.opening_cash)),
      openingDiscrepancy: sumOrNull(opens.map((r) => r.cash_discrepancy)),
      openingDiscrepancyReason: joinOrNull(opens.map((r) => r.cash_discrepancy_reason)),
      closingCash: sumOrNull(closes.map((r) => r.closing_cash)),
      cashDeposited: sumOrNull(closes.map((r) => r.cash_deposited)),
      closingDiscrepancyNotes: joinOrNull(closes.map((r) => r.discrepancy_notes)),
      salesCash: sale ? Number(sale.cash_sales) : 0,
      cashOutTotal: cashOut.reduce((sum, e) => sum + Number(e.amount), 0),
      cashOut,
    });
  }
  return out;
}

/* ─────────────────────────── helpers ─────────────────────────── */

function groupByDate<T extends { date: string }>(rows: T[]): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const r of rows) {
    if (!m.has(r.date)) m.set(r.date, []);
    m.get(r.date)!.push(r);
  }
  return m;
}

/** One sales row per date, with every outlet's amounts for that date added together. */
function sumSalesByDate(rows: DailySales[]): Map<string, DailySales> {
  const m = new Map<string, DailySales>();
  for (const r of rows) {
    const prev = m.get(r.date);
    m.set(r.date, prev
      ? {
          ...prev,
          cash_sales: Number(prev.cash_sales) + Number(r.cash_sales),
          online_sales: Number(prev.online_sales) + Number(r.online_sales),
          aggregator_sales: Number(prev.aggregator_sales) + Number(r.aggregator_sales),
        }
      : r);
  }
  return m;
}

function sumOrNull(values: Array<number | string | null | undefined>): number | null {
  const present = values.filter((v) => v !== null && v !== undefined && v !== "");
  return present.length ? present.reduce<number>((t, v) => t + Number(v), 0) : null;
}

function joinOrNull(values: Array<string | null | undefined>): string | null {
  const present = values.filter((v): v is string => !!v && v.trim() !== "");
  return present.length ? present.join(" · ") : null;
}
