import { createAdminClient } from "./supabase/admin";
import { todayIST } from "./date";
import { notifyStaff } from "./push";

async function isEnabled(key: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from("app_settings").select("value").eq("key", key).maybeSingle();
    return data?.value !== "false";
  } catch {
    return true;
  }
}

export async function sendPunchoutReminder() {
  if (!(await isEnabled("notify_punchout_enabled"))) return;
  await notifyStaff.punchoutReminder();
}

/** Check remaining EOD tasks and notify only for incomplete ones. */
export async function sendEodTaskReminders() {
  if (!(await isEnabled("notify_eod_tasks_enabled"))) return;
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
