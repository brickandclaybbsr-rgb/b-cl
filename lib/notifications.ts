import { Capacitor } from "@capacitor/core";

const API_BASE_URL = "";

/**
 * Register for FCM push on the native shell and persist the device token to the
 * signed-in profile. Entirely a no-op on the web build.
 */
export async function initPushNotifications() {
  if (!Capacitor.isNativePlatform()) return;

  const { PushNotifications } = await import("@capacitor/push-notifications");

  const permission = await PushNotifications.requestPermissions();
  if (permission.receive !== "granted") return;

  // High-importance channel (heads-up alerts) — must match channelId in lib/push.ts.
  if (Capacitor.getPlatform() === "android") {
    try {
      await PushNotifications.createChannel({
        id: "bnc_ops_alerts",
        name: "B&C Ops Alerts",
        description: "Sales, stock, vendor and report alerts",
        importance: 5,
        visibility: 1,
        sound: "default",
      });
    } catch {
      /* channel API unavailable — ignore */
    }
  }

  await PushNotifications.register();

  PushNotifications.addListener("registration", async (token) => {
    await saveFCMToken(token.value);
  });

  PushNotifications.addListener("registrationError", (err) => {
    console.error("FCM registration error:", err);
  });

  PushNotifications.addListener("pushNotificationReceived", (notification) => {
    console.log("Push received (foreground):", notification);
  });

  PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    const route = action.notification.data?.route;
    if (route) window.location.href = route;
  });
}

async function saveFCMToken(token: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/profile/fcm-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      credentials: "include",
    });
    return res.json();
  } catch (err) {
    console.error("Failed to save FCM token:", err);
  }
}
