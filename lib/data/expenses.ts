import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { todayIST } from "@/lib/date";
import type { CashExpense } from "@/lib/database.types";

// Each reader takes an optional outlet: pass it to see one outlet's cash outs,
// omit it to see every outlet's.

export async function getTodayCashExpenses(outletId?: string | null): Promise<CashExpense[]> {
  return getCashExpensesByDate(todayIST(), outletId);
}

export async function getCashExpensesByDate(date: string, outletId?: string | null): Promise<CashExpense[]> {
  const supabase = createClient();
  let q = supabase.from("cash_expenses").select("*").eq("date", date);
  if (outletId) q = q.eq("outlet_id", outletId);
  const { data } = await q.order("submitted_at", { ascending: false });
  return (data ?? []) as CashExpense[];
}

export async function getRecentCashExpenses(days = 7, outletId?: string | null): Promise<CashExpense[]> {
  const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const run = async (supabase: ReturnType<typeof createAdminClient> | ReturnType<typeof createClient>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q = (supabase as any).from("cash_expenses").select("*").gte("date", cutoff);
    if (outletId) q = q.eq("outlet_id", outletId);
    const { data } = await q.order("date", { ascending: false }).order("submitted_at", { ascending: false });
    return (data ?? []) as CashExpense[];
  };
  try {
    return await run(createAdminClient());
  } catch {
    return run(createClient());
  }
}
