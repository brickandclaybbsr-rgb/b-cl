/**
 * Base URL for the live app. Used by native (Capacitor) builds, where the
 * WebView loads the deployed site and same-origin relative URLs are not always
 * available before the first navigation. On the web this is the same origin.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://b-cl.vercel.app";
