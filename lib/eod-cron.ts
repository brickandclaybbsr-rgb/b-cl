import { createAdminClient } from "./supabase/admin";
import { todayIST } from "./date";
import { notifyStaff } from "./push";

export async function sendPunchoutReminder() {
  await notifyStaff.punchoutReminder();
}

/** Check remaining EOD tasks and notify only for incomplete ones. */
export async function sendEodTaskReminders() {
  const supabase = createAdminClient();
  const today = todayIST();

  const [{ data: closing }, { data: sales }] = await Promise.all([
    supabase.from("closing_checklists").select("id").eq("date", today).maybeSingle(),
    supabase.from("daily_sales").select("id, closing_balance").eq("date", today).maybeSingle(),
  ]);

  const tasks: Promise<void>[] = [];

  if (!closing) {
    tasks.push(notifyStaff.eodClosingChecklistReminder());
  }

  if (!sales) {
    tasks.push(notifyStaff.eodSalesReminder());
    tasks.push(notifyStaff.eodClosingBalanceReminder());
  } else if (!sales.closing_balance) {
    tasks.push(notifyStaff.eodClosingBalanceReminder());
  }

  await Promise.all(tasks);
}
