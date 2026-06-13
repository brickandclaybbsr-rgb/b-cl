"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
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
  const category = (["withdrawal","advance","expense","other"].includes(categoryRaw)
    ? categoryRaw
    : "withdrawal") as "withdrawal" | "advance" | "expense" | "other";
  const notes = String(formData.get("notes") ?? "").trim();

  if (!person_name) return { error: "Please enter the person's name." };
  const amount = parseFloat(amountRaw);
  if (!amountRaw || isNaN(amount) || amount <= 0) {
    return { error: "Please enter a valid amount." };
  }

  const { error } = await supabase.from("cash_expenses").insert({
    date: todayIST(),
    person_name,
    amount,
    category: category,
    notes: notes || null,
    submitted_by: profile.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/expenses");
  revalidatePath("/owner");
  return { ok: true };
}

export async function deleteCashExpense(
  _prev: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Missing id." };
  const supabase = createClient();
  const { error } = await supabase.from("cash_expenses").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/expenses");
  revalidatePath("/owner");
  return { ok: true };
}
