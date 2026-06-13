import type { SupabaseClient } from "@supabase/supabase-js";
import { getMessaging } from "firebase-admin/messaging";
import { isFirebaseConfigured } from "./firebase-admin";
import { createAdminClient } from "./supabase/admin";
import { hasServiceRole } from "./supabase/env";

type ProfileToken = { fcm_token: string | null };

const ANDROID_CONFIG = {
  priority: "high" as const,
  notification: {
    sound: "bnc_alert",
    channelId: "bnc_ops_alerts",
    color: "#E8620A",
    vibrateTimingsMillis: [0, 1000, 300, 1000, 300, 1000, 300, 1000, 300, 1000],
    defaultVibrateTimings: false,
  },
};

async function getTokensByRole(role: "owner" | "staff" | "all"): Promise<string[]> {
  if (!isFirebaseConfigured() || !hasServiceRole()) return [];
  const supabase = createAdminClient() as unknown as SupabaseClient;
  let query = supabase.from("profiles").select("fcm_token").not("fcm_token", "is", null);
  if (role !== "all") query = query.eq("role", role);
  const { data } = await query;
  return ((data ?? []) as ProfileToken[])
    .map((p) => p.fcm_token)
    .filter((t): t is string => Boolean(t));
}

async function sendPush(tokens: string[], title: string, body: string, route?: string) {
  if (tokens.length === 0) return;
  try {
    await getMessaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: route ? { route } : {},
      android: ANDROID_CONFIG,
    });
  } catch (err) {
    console.error("Push notification failed:", err);
  }
}

export async function sendPushToOwner(title: string, body: string, route?: string) {
  try {
    const tokens = await getTokensByRole("owner");
    await sendPush(tokens, title, body, route);
  } catch (err) {
    console.error("sendPushToOwner failed:", err);
  }
}

export async function sendPushToStaff(title: string, body: string, route?: string) {
  try {
    const tokens = await getTokensByRole("staff");
    await sendPush(tokens, title, body, route);
  } catch (err) {
    console.error("sendPushToStaff failed:", err);
  }
}

export async function sendPushToAll(title: string, body: string, route?: string) {
  try {
    const tokens = await getTokensByRole("all");
    await sendPush(tokens, title, body, route);
  } catch (err) {
    console.error("sendPushToAll failed:", err);
  }
}

export async function sendPushToProfile(profileId: string, title: string, body: string, route?: string) {
  try {
    if (!isFirebaseConfigured() || !hasServiceRole()) return;
    const supabase = createAdminClient() as unknown as SupabaseClient;
    const { data } = await supabase.from("profiles").select("fcm_token").eq("id", profileId).maybeSingle();
    const token = (data as ProfileToken | null)?.fcm_token;
    if (!token) return;
    await sendPush([token], title, body, route);
  } catch (err) {
    console.error("sendPushToProfile failed:", err);
  }
}

// Owner receives — triggered by staff actions
export const notifyOwner = {
  salesSubmitted: (amount: number) =>
    sendPushToOwner("💰 Sales Submitted", `Today's total: ₹${amount.toLocaleString("en-IN")}`, "/owner"),

  checklistSubmitted: (staff: string, type: "opening" | "closing") =>
    sendPushToOwner(`✅ ${type === "opening" ? "Opening" : "Closing"} Checklist`, `${staff} submitted the checklist`, `/owner`),

  leaveRequest: (staffName: string, type: string) =>
    sendPushToOwner("🗓️ Leave Request", `${staffName} submitted a ${type.toUpperCase()} leave request`, "/attendance"),

  reimbursement: (staffName: string, amount: number) =>
    sendPushToOwner("💸 Reimbursement", `${staffName} claimed ₹${amount.toLocaleString("en-IN")}`, "/owner"),

  vendorOrder: (staffName: string) =>
    sendPushToOwner("🛒 New Order Request", `${staffName} raised a vendor order`, "/vendors"),

  eodReport: () =>
    sendPushToOwner("✅ EOD Report Ready", "Daily report has been generated", "/owner"),
};

// Staff receives — reminders and alerts
export const notifyStaff = {
  openingChecklistReminder: () =>
    sendPushToStaff("🌅 Opening Checklist", "Please submit the opening checklist now", "/checklist/opening"),

  closingChecklistReminder: () =>
    sendPushToStaff("🌆 Closing Checklist", "Please submit the closing checklist now", "/checklist/closing"),

  salesReminder: () =>
    sendPushToStaff("💰 Sales Entry", "Don't forget to submit today's sales", "/sales"),

  attendanceReminder: () =>
    sendPushToStaff("🕐 Mark Attendance", "Please mark your attendance for today", "/profile"),

  leaveApproved: (profileId: string, type: string) =>
    sendPushToProfile(profileId, "✅ Leave Approved", `Your ${type.toUpperCase()} leave has been approved`, "/profile"),

  leaveRejected: (profileId: string, type: string) =>
    sendPushToProfile(profileId, "❌ Leave Rejected", `Your ${type.toUpperCase()} leave request was not approved`, "/profile"),
};
