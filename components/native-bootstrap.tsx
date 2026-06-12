"use client";

import { useEffect } from "react";
import { initPushNotifications } from "@/lib/notifications";
import { setStatusBar } from "@/lib/native";

/**
 * Client-only side effects for the native (Capacitor) shell: dark status bar
 * and FCM push registration. Renders nothing and is inert on the web.
 */
export function NativeBootstrap() {
  useEffect(() => {
    void setStatusBar();
    void initPushNotifications();
  }, []);

  return null;
}
