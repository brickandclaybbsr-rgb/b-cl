import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { todayIST } from "@/lib/date";
import type { CashExpense } from "@/lib/database.types";

export async function getTodayCashExpenses(): Promise<CashExpense[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("cash_expenses")
    .select("*")
    .eq("date", todayIST())
    .order("submitted_at", { ascending: false });
  return (data ?? []) as CashExpense[];
}

export async function getCashExpensesByDate(date: string): Promise<CashExpense[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("cash_expenses")
    .select("*")
    .eq("date", date)
    .order("submitted_at", { ascending: false });
  return (data ?? []) as CashExpense[];
}

export async function getRecentCashExpenses(days = 7): Promise<CashExpense[]> {
  try {
    const supabase = createAdminClient();
    const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
    const { data } = await supabase
      .from("cash_expenses")
      .select("*")
      .gte("date", cutoff)
      .order("date", { ascending: false })
      .order("submitted_at", { ascending: false });
    return (data ?? []) as CashExpense[];
  } catch {
    const supabase = createClient();
    const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
    const { data } = await supabase
      .from("cash_expenses")
      .select("*")
      .gte("date", cutoff)
      .order("date", { ascending: false })
      .order("submitted_at", { ascending: false });
    return (data ?? []) as CashExpense[];
  }
}
