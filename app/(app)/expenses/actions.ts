"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, canDeleteFinancialRecords } from "@/lib/auth";
import { todayIST } from "@/lib/date";

export type ExpenseFormState = { ok?: boolean; error?: string };

export async function addCashExpense(
  _prev: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const profile = await requireProfile();
  const supabase = createClient();

  const person_name = String(formData.get("person_name") ?? "").trim();
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const categoryRaw = String(formData.get("category") ?? "withdrawal").trim();
  const category = (["withdrawal","advance","expense","other","deposit"].includes(categoryRaw)
    ? categoryRaw
    : "withdrawal") as "withdrawal" | "advance" | "expense" | "other" | "deposit";
  const notes = String(formData.get("notes") ?? "").trim();

  if (!person_name) return { error: "Please enter the person's name." };
  const amount = parseFloat(amountRaw);
  if (!amountRaw || isNaN(amount) || amount <= 0) {
    return { error: "Please enter a valid amount." };
  }

  const today = todayIST();
  const dateRaw = String(formData.get("date") ?? "").trim();
  // Only allow today or past dates (no future filing)
  const date = (dateRaw && dateRaw <= today) ? dateRaw : today;

  const { error } = await supabase.from("cash_expenses").insert({
    date,
    person_name,
    amount,
    category: category,
    notes: notes || null,
    submitted_by: profile.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/sales");
  revalidatePath("/owner");
  return { ok: true };
}

export async function updateCashExpense(
  _prev: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  await requireProfile();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Missing id." };

  const person_name = String(formData.get("person_name") ?? "").trim();
  const amountRaw   = String(formData.get("amount") ?? "").trim();
  const categoryRaw = String(formData.get("category") ?? "withdrawal").trim();
  const category = (["withdrawal", "advance", "expense", "other", "deposit"].includes(categoryRaw)
    ? categoryRaw : "withdrawal") as "withdrawal" | "advance" | "expense" | "other" | "deposit";
  const notes = String(formData.get("notes") ?? "").trim();

  if (!person_name) return { error: "Please enter the person's name." };
  const amount = parseFloat(amountRaw);
  if (!amountRaw || isNaN(amount) || amount <= 0) return { error: "Please enter a valid amount." };

  const supabase = createClient();
  const { error } = await supabase
    .from("cash_expenses")
    .update({ person_name, amount, category, notes: notes || null })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/sales");
  revalidatePath("/owner");
  revalidatePath("/owner/cashout");
  return { ok: true };
}

export async function addMultipleCashExpenses(
  rows: Array<{ person_name: string; amount: string; category: string; notes: string }>,
  date: string,
): Promise<ExpenseFormState> {
  const profile = await requireProfile();
  const supabase = createClient();
  const today = todayIST();
  const safeDate = date && date <= today ? date : today;

  const inserts: Array<{
    date: string; person_name: string; amount: number;
    category: "withdrawal" | "advance" | "expense" | "other" | "deposit";
    notes: string | null; submitted_by: string;
  }> = [];

  for (const row of rows) {
    const person_name = row.person_name.trim();
    const amount = parseFloat(row.amount);
    const categoryRaw = row.category;
    const category = (["withdrawal", "advance", "expense", "other"].includes(categoryRaw)
      ? categoryRaw : "withdrawal") as "withdrawal" | "advance" | "expense" | "other" | "deposit";
    const notes = row.notes.trim();
    if (!person_name || isNaN(amount) || amount <= 0) continue;
    inserts.push({ date: safeDate, person_name, amount, category, notes: notes || null, submitted_by: profile.id });
  }

  if (!inserts.length) return { error: "No valid entries to save." };
  const { error } = await supabase.from("cash_expenses").insert(inserts);
  if (error) return { error: error.message };
  revalidatePath("/sales");
  revalidatePath("/owner");
  return { ok: true };
}

export async function deleteCashExpense(
  _prev: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const profile = await requireProfile();
  if (!canDeleteFinancialRecords(profile)) {
    return { error: "You don't have permission to delete cash-out entries." };
  }
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Missing id." };
  const supabase = createClient();
  const { error } = await supabase.from("cash_expenses").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/sales");
  revalidatePath("/owner");
  revalidatePath("/owner/cashout");
  return { ok: true };
}
