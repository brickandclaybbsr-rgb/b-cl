import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { hasSupabaseEnv } from "@/lib/supabase/env";

const OWNER_PREFIXES = ["/owner", "/settings", "/reports"];

export async function middleware(request: NextRequest) {
  // Without Supabase configured, skip auth gating so the setup page can render.
  if (!hasSupabaseEnv()) return NextResponse.next();

  const { response, user, supabase } = await updateSession(request);
  const path = request.nextUrl.pathname;
  const isLogin = path === "/login";

  // Public routes — accessible without login.
  const PUBLIC_PATHS = ["/login", "/privacy", "/delete-data"];
  if (!user) {
    if (PUBLIC_PATHS.includes(path)) return response;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // Authenticated user hitting /login → send to their home.
  if (isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Owner-only areas: bounce staff back to their dashboard.
  if (OWNER_PREFIXES.some((p) => path === p || path.startsWith(p + "/"))) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "owner") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on everything except Next internals, the API (handles its own auth),
     * and static asset/PWA files.
     */
    "/((?!_next/static|_next/image|api|favicon.ico|manifest.json|sw.js|workbox-|fallback-|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
