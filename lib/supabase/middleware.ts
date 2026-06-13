import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

// 400 days — ensures cookies survive Android WebView restarts.
// The actual token validity is enforced server-side by Supabase regardless.
const COOKIE_MAX_AGE = 60 * 60 * 24 * 400;

/**
 * Refreshes the Supabase auth session on every request and returns the user
 * alongside the response (whose cookies must be forwarded to the browser).
 * Follows the canonical @supabase/ssr middleware pattern.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookieOptions: {
      maxAge: COOKIE_MAX_AGE,
      sameSite: "lax",
      secure: true,
    },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, {
            maxAge: COOKIE_MAX_AGE,
            sameSite: "lax",
            secure: true,
            ...options,
          }),
        );
      },
    },
  });

  // IMPORTANT: do not run logic between client creation and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user, supabase };
}
