"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth";
import { sendPushToStaff, sendPushToOwner, sendPushToAll } from "@/lib/push";
import { sendPunchoutReminder, sendEodTaskReminders } from "@/lib/eod-cron";
import { createAdminClient } from "@/lib/supabase/admin";

export type NotifyState = { ok?: boolean; error?: string };

export async function sendCustomNotification(
  _prev: NotifyState,
  formData: FormData,
): Promise<NotifyState> {
  try {
    await requireOwner();
    const title = String(formData.get("title") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();
    const target = String(formData.get("target") ?? "staff");
    if (!title) return { error: "Title is required." };
    if (!body) return { error: "Message body is required." };
    if (target === "staff") await sendPushToStaff(title, body);
    else if (target === "owner") await sendPushToOwner(title, body);
    else await sendPushToAll(title, body);
    return { ok: true };
  } catch (err: any) {
    return { error: err.message || "Failed to send notification." };
  }
}

export async function toggleNotificationSetting(
  _prev: NotifyState,
  formData: FormData,
): Promise<NotifyState> {
  try {
    await requireOwner();
    const key = String(formData.get("key") ?? "").trim();
    const value = String(formData.get("value") ?? "true").trim();
    if (!key) return { error: "Missing key." };
    const supabase = createAdminClient();
    await supabase.from("app_settings").upsert({ key, value }, { onConflict: "key" });
    revalidatePath("/notifications");
    return { ok: true };
  } catch (err: any) {
    return { error: err.message || "Failed to save setting." };
  }
}

export async function triggerManualNotification(
  _prev: NotifyState,
  formData: FormData,
): Promise<NotifyState> {
  try {
    await requireOwner();
    const type = String(formData.get("type") ?? "").trim();
    if (type === "punchout") {
      await sendPunchoutReminder();
    } else if (type === "tasks") {
      await sendEodTaskReminders();
    } else {
      return { error: "Unknown notification type." };
    }
    return { ok: true };
  } catch (err: any) {
    return { error: err.message || "Failed to trigger notification." };
  }
}
