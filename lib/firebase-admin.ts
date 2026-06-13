import { initializeApp, getApps, cert } from "firebase-admin/app";

/** True when all Firebase Admin credentials are present in the environment. */
export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY,
  );
}

// Initialise lazily and only when configured, so the app keeps working before
// Firebase env vars are added (push simply becomes a no-op). Importing this
// module is enough to ensure the default app exists.
if (isFirebaseConfigured() && getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}
