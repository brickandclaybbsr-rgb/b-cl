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

export type Coords = { latitude: number; longitude: number };

/**
 * Get the device's current position.
 *
 * Inside the Android/iOS shell this goes through @capacitor/geolocation, which
 * triggers the OS runtime-permission prompt. The plain WebView
 * `navigator.geolocation` API does NOT request Android runtime permission, so
 * without this the app silently never asks and the user has to grant location
 * by hand in system settings. On the web we fall back to the browser API.
 *
 * Throws an Error with a user-facing message when permission is denied or the
 * position can't be read.
 */
export async function getCurrentCoords(): Promise<Coords> {
  // The app shell loads the web app from a remote URL, so this JavaScript can
  // be newer than the installed native build. Older builds don't ship the
  // Geolocation plugin and throw "not implemented on android" — so any plugin
  // failure must fall back to the WebView API rather than block check-in.
  if (isNative()) {
    try {
      const { Geolocation } = await import("@capacitor/geolocation");

      let status = await Geolocation.checkPermissions();
      if (status.location !== "granted" && status.coarseLocation !== "granted") {
        status = await Geolocation.requestPermissions({ permissions: ["location"] });
      }
      if (status.location !== "granted" && status.coarseLocation !== "granted") {
        throw new Error(
          "Location permission is required to mark attendance. Please allow location access and try again.",
        );
      }

      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });
      return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    } catch (err: any) {
      // A genuine permission refusal should surface to the user as-is.
      if (typeof err?.message === "string" && err.message.includes("Location permission is required")) {
        throw err;
      }
      // Plugin missing / not implemented / any other failure → browser API.
      console.warn("Geolocation plugin unavailable, falling back to WebView API:", err?.message);
    }
  }

  return browserCoords();
}

function browserCoords(): Promise<Coords> {
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
    throw new Error("This device can't share its location, which is required to mark attendance.");
  }

  return new Promise<Coords>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => {
        const msg =
          err?.code === 1
            ? "Location permission is blocked. Allow location for this app (Settings → Apps → B&CL Ops → Permissions → Location), then try again."
            : "Couldn't read your location. Make sure location/GPS is switched on, then try again.";
        reject(new Error(msg));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}
