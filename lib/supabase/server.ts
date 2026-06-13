import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 400;

/**
 * Server-side Supabase client (Server Components, Route Handlers, Server
 * Actions). Reads/writes the auth cookie via Next's cookie store.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookieOptions: {
      maxAge: COOKIE_MAX_AGE,
      sameSite: "lax",
      secure: true,
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, {
              maxAge: COOKIE_MAX_AGE,
              sameSite: "lax",
              secure: true,
              ...options,
            }),
          );
        } catch {
          // Called from a Server Component where cookies are read-only.
          // Session refresh is handled by middleware, so this is safe to ignore.
        }
      },
    },
  });
}
