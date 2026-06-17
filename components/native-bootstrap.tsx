"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { initPushNotifications } from "@/lib/notifications";
import { setStatusBar } from "@/lib/native";
import { isNative } from "@/lib/native";

// Routes where back = minimize app (not navigate back)
const HOME_ROUTES = ["/dashboard", "/owner", "/sales", "/stock", "/vendors", "/attendance"];

export function NativeBootstrap() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    void setStatusBar();
    void initPushNotifications();
  }, []);

  useEffect(() => {
    if (!isNative()) return;

    let cleanup: (() => void) | undefined;

    async function registerBackButton() {
      try {
        const { App } = await import("@capacitor/app");
        const handle = await App.addListener("backButton", ({ canGoBack }) => {
          const isHome = HOME_ROUTES.some(
            (r) => pathname === r || pathname.startsWith(r + "/") && r !== "/"
          );
          if (isHome || !canGoBack) {
            // On home screens — minimize the app instead of going back
            void App.minimizeApp();
          } else {
            router.back();
          }
        });
        cleanup = () => handle.remove();
      } catch {
        // Capacitor App plugin unavailable — no-op
      }
    }

    void registerBackButton();
    return () => cleanup?.();
  }, [pathname, router]);

  return null;
}
