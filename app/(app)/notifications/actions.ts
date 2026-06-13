"use server";

import { requireOwner } from "@/lib/auth";
import { sendPushToStaff, sendPushToOwner, sendPushToAll } from "@/lib/push";

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

    if (target === "staff") {
      await sendPushToStaff(title, body);
    } else if (target === "owner") {
      await sendPushToOwner(title, body);
    } else {
      await sendPushToAll(title, body);
    }

    return { ok: true };
  } catch (err: any) {
    return { error: err.message || "Failed to send notification." };
  }
}
