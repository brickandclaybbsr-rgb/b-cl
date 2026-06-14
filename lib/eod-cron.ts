import { createAdminClient } from "./supabase/admin";
import { todayIST } from "./date";
import { notifyStaff, sendPushToTeam } from "./push";

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

/** Send opening checklist reminder to each team only if they haven't submitted yet. */
export async function sendOpeningChecklistReminders() {
  const supabase = createAdminClient();
  const today = todayIST();
  const [{ data: kitchen }, { data: frontDesk }] = await Promise.all([
    supabase.from("opening_checklists").select("id").eq("date", today).eq("team", "kitchen").maybeSingle(),
    supabase.from("opening_checklists").select("id").eq("date", today).eq("team", "front_desk").maybeSingle(),
  ]);
  await Promise.all([
    kitchen  ? null : sendPushToTeam("kitchen",    "🌅 Opening Checklist", "Kitchen opening checklist not submitted yet", "/checklist/opening"),
    frontDesk ? null : sendPushToTeam("front_desk", "🌅 Opening Checklist", "Front desk opening checklist not submitted yet", "/checklist/opening"),
  ].filter(Boolean) as Promise<void>[]);
}

/** Send closing checklist reminder to each team only if they haven't submitted yet. */
export async function sendClosingChecklistReminders() {
  const supabase = createAdminClient();
  const today = todayIST();
  const [{ data: kitchen }, { data: frontDesk }] = await Promise.all([
    supabase.from("closing_checklists").select("id").eq("date", today).eq("team", "kitchen").maybeSingle(),
    supabase.from("closing_checklists").select("id").eq("date", today).eq("team", "front_desk").maybeSingle(),
  ]);
  await Promise.all([
    kitchen   ? null : sendPushToTeam("kitchen",    "🌆 Closing Checklist", "Kitchen closing checklist not submitted yet", "/checklist/closing"),
    frontDesk ? null : sendPushToTeam("front_desk", "🌆 Closing Checklist", "Front desk closing checklist not submitted yet", "/checklist/closing"),
  ].filter(Boolean) as Promise<void>[]);
}

/** Send closing balance reminder to front desk only if daily sales not entered yet. */
export async function sendClosingBalanceReminderIfPending() {
  const supabase = createAdminClient();
  const today = todayIST();
  const { data: sales } = await supabase.from("daily_sales").select("id").eq("date", today).maybeSingle();
  if (!sales) await notifyStaff.eodClosingBalanceReminder();
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
