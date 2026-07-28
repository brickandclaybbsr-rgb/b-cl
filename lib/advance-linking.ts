/**
 * Keeps a cash-out "Advance" entry in sync with payroll_advances so it flows
 * automatically into payroll and the salary slip — no duplicate manual entry.
 *
 * Matching is by exact staff name (case-insensitive) against active,
 * non-owner profiles. If no match is found the cash-out entry still saves
 * normally; it just isn't linked to payroll (the UI hints staff to type the
 * name exactly as it appears in their profile).
 */

async function matchStaffProfileId(supabase: any, personName: string): Promise<string | null> {
  const name = personName.trim();
  if (!name) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, name")
    .neq("role", "owner")
    .eq("is_active", true);

  const match = (data ?? []).find(
    (p: any) => p.name.trim().toLowerCase() === name.toLowerCase(),
  );
  return match?.id ?? null;
}

/**
 * Called after a cash_expenses row is inserted. If it's an "advance" entry
 * that matches a staff member, links it and mirrors it into payroll_advances.
 */
export async function syncAdvanceOnInsert(
  supabase: any,
  cashExpense: { id: string; category: string; person_name: string; amount: number; date: string; notes: string | null },
  recordedBy: string,
): Promise<void> {
  if (cashExpense.category !== "advance") return;

  const profileId = await matchStaffProfileId(supabase, cashExpense.person_name);
  if (!profileId) return;

  await supabase.from("cash_expenses").update({ profile_id: profileId }).eq("id", cashExpense.id);

  await supabase.from("payroll_advances").insert({
    profile_id: profileId,
    month: cashExpense.date.slice(0, 7), // YYYY-MM
    amount: cashExpense.amount,
    notes: cashExpense.notes,
    advance_date: cashExpense.date,
    recorded_by: recordedBy,
    cash_expense_id: cashExpense.id,
  });
}

/**
 * Called after a cash_expenses row is updated. Keeps the linked
 * payroll_advances row (if any) in sync, creates one if the entry newly
 * became an advance with a matching name, or removes the link if it no
 * longer qualifies.
 */
export async function syncAdvanceOnUpdate(
  supabase: any,
  cashExpenseId: string,
  updated: { category: string; person_name: string; amount: number; notes: string | null },
  recordedBy: string,
): Promise<void> {
  const { data: existingAdvance } = await supabase
    .from("payroll_advances")
    .select("id, profile_id")
    .eq("cash_expense_id", cashExpenseId)
    .maybeSingle();

  if (updated.category !== "advance") {
    if (existingAdvance) {
      await supabase.from("payroll_advances").delete().eq("id", existingAdvance.id);
      await supabase.from("cash_expenses").update({ profile_id: null }).eq("id", cashExpenseId);
    }
    return;
  }

  if (existingAdvance) {
    await supabase
      .from("payroll_advances")
      .update({ amount: updated.amount, notes: updated.notes })
      .eq("id", existingAdvance.id);
    return;
  }

  // Newly became (or still is) an advance with no link yet — try to link now.
  const { data: cashExpense } = await supabase
    .from("cash_expenses")
    .select("date")
    .eq("id", cashExpenseId)
    .single();
  if (!cashExpense) return;

  const profileId = await matchStaffProfileId(supabase, updated.person_name);
  if (!profileId) return;

  await supabase.from("cash_expenses").update({ profile_id: profileId }).eq("id", cashExpenseId);
  await supabase.from("payroll_advances").insert({
    profile_id: profileId,
    month: cashExpense.date.slice(0, 7),
    amount: updated.amount,
    notes: updated.notes,
    advance_date: cashExpense.date,
    recorded_by: recordedBy,
    cash_expense_id: cashExpenseId,
  });
}
