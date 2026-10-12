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

export type Coords = { latitude: number; longitude: number; accuracy?: number };

/** Good enough to stop waiting for a better fix. */
const GOOD_ACCURACY_M = 50;
/** Total time to spend trying before giving up on a position entirely. */
const FIX_BUDGET_MS = 12_000;

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

      // Staged, not all-or-nothing. The QR is scanned INSIDE the restaurant,
      // where a true GPS lock often never arrives — the old single attempt
      // (high accuracy, maximumAge 0, 15s) simply failed there, and staff gave
      // up and had the day marked by hand later. Fall back to a coarse or
      // recent fix instead; the server widens the geofence by the reported
      // accuracy, so a rough position taken at the outlet still passes.
      const attempts = [
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 15_000 },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 120_000 },
      ];
      for (const options of attempts) {
        try {
          const pos = await Geolocation.getCurrentPosition(options);
          return {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy ?? undefined,
          };
        } catch {
          // Try the next strategy, then the WebView API below.
        }
      }
      throw new Error("plugin returned no position");
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

  // watchPosition rather than getCurrentPosition: indoors the first fix is
  // usually a coarse network one that then improves over a few seconds. Taking
  // the BEST fix inside a time budget — and settling early once it is good
  // enough — succeeds in places where a single high-accuracy call just times
  // out. Only an outright permission refusal fails fast; "position
  // unavailable" keeps waiting, because a later fix may still arrive.
  return new Promise<Coords>((resolve, reject) => {
    let best: GeolocationPosition | null = null;
    let settled = false;
    let watchId: number | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (timer !== null) clearTimeout(timer);
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };

    const finish = () => {
      if (settled) return;
      settled = true;
      cleanup();
      if (best) {
        resolve({
          latitude: best.coords.latitude,
          longitude: best.coords.longitude,
          accuracy: best.coords.accuracy ?? undefined,
        });
      } else {
        reject(new Error("Couldn't read your location. Make sure location/GPS is switched on, then try again."));
      }
    };

    const fail = (message: string) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error(message));
    };

    timer = setTimeout(finish, FIX_BUDGET_MS);

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!best || pos.coords.accuracy < best.coords.accuracy) best = pos;
        if (pos.coords.accuracy <= GOOD_ACCURACY_M) finish();
      },
      (err) => {
        if (err?.code === 1) {
          fail("Location permission is blocked. Allow location for this app (Settings → Apps → B&CL Ops → Permissions → Location), then try again.");
        }
        // Otherwise keep waiting — the budget timer decides when to stop.
      },
      { enableHighAccuracy: true, timeout: FIX_BUDGET_MS, maximumAge: 30_000 },
    );
  });
}
