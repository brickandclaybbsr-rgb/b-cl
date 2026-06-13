import { Capacitor } from "@capacitor/core";

/** True only inside the Capacitor Android/iOS shell (not the mobile browser). */
export const isNative = () => Capacitor.isNativePlatform();

/** Match the native status bar to the app's dark chrome. No-op on web. */
export async function setStatusBar() {
  if (!isNative()) return;
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#0F0D0B" });
  } catch {
    // Plugin unavailable (e.g. web) — ignore.
  }
}

export async function hapticSuccess() {
  if (!isNative()) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {
    /* no-op on web */
  }
}

export async function hapticError() {
  if (!isNative()) return;
  try {
    const { Haptics, NotificationType } = await import("@capacitor/haptics");
    await Haptics.notification({ type: NotificationType.Error });
  } catch {
    /* no-op on web */
  }
}

export async function hapticLight() {
  if (!isNative()) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    /* no-op on web */
  }
}
