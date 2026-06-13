import type { CapacitorConfig } from "@capacitor/cli";

/**
 * The Android shell loads the live Vercel deployment (server.url) so all
 * server-rendered routes, server actions, and auth keep working unchanged.
 * `webDir` (out/) is only a local fallback splash, never the runtime source.
 */
const config: CapacitorConfig = {
  appId: "in.brickandclay.ops",
  appName: "B&C Ops",
  webDir: "out",
  server: {
    url: "https://b-cl.vercel.app",
    cleartext: false,
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#0F0D0B",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0F0D0B",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
