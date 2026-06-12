import type { SupabaseClient } from "@supabase/supabase-js";
import { getMessaging } from "firebase-admin/messaging";
import { isFirebaseConfigured } from "./firebase-admin";
import { createAdminClient } from "./supabase/admin";
import { hasServiceRole } from "./supabase/env";

type OwnerToken = { fcm_token: string | null };

/**
 * Send a push notification to every owner that has a registered FCM token.
 *
 * Reads tokens with the service-role client (staff sessions can't see owner
 * rows under RLS). Safe to call from any server action — it silently no-ops
 * until Firebase + the service-role key are configured, and never throws.
 */
export async function sendPushToOwner(
  title: string,
  body: string,
  route?: string,
) {
  try {
    if (!isFirebaseConfigured() || !hasServiceRole()) return;

    // `fcm_token` is added by a migration that may land separately from this
    // branch, so we read it through an untyped client view to stay independent
    // of whether the column is present in the generated Database types yet.
    const supabase = createAdminClient() as unknown as SupabaseClient;
    const { data: owners } = await supabase
      .from("profiles")
      .select("fcm_token")
      .eq("role", "owner")
      .not("fcm_token", "is", null);

    const tokens = ((owners ?? []) as OwnerToken[])
      .map((o) => o.fcm_token)
      .filter((t): t is string => Boolean(t));
    if (tokens.length === 0) return;

    await getMessaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: route ? { route } : {},
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "bnc_ops_alerts",
          color: "#E8620A",
        },
      },
    });
  } catch (err) {
    console.error("Push notification failed:", err);
  }
}

// Convenience wrappers — use these throughout the app.
export const notifyOwner = {
  stockAlert: (itemName: string) =>
    sendPushToOwner("📦 Stock Alert", `${itemName} is out of stock`, "/owner"),

  salesSubmitted: (amount: number) =>
    sendPushToOwner(
      "💰 Sales Submitted",
      `Today's total: ₹${amount.toLocaleString("en-IN")}`,
      "/owner",
    ),

  eodReport: () =>
    sendPushToOwner("✅ EOD Report Ready", "Daily report has been generated", "/owner"),

  checklistPending: (type: "opening" | "closing") =>
    sendPushToOwner(
      "⚠️ Checklist Pending",
      `${type === "opening" ? "Opening" : "Closing"} checklist not submitted yet`,
      `/checklist/${type}`,
    ),

  vendorOrder: (staffName: string) =>
    sendPushToOwner("🛒 New Order Request", `${staffName} raised a vendor order`, "/vendors"),
};
