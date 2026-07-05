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

  // Determine if a role check is needed before doing a DB query.
  const isOwnerRoute = OWNER_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));
  // Routes inventory managers are allowed to visit
  const isInventoryManagerRoute =
    path === "/stock" || path.startsWith("/stock/") ||
    path === "/vendors" || path.startsWith("/vendors/");

  // Only fetch the role when we actually need to enforce a restriction,
  // so unrestricted staff routes skip the DB round-trip.
  if (isOwnerRoute || !isInventoryManagerRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const role = profile?.role;

    // Owner-only areas: bounce everyone else.
    if (isOwnerRoute && role !== "owner") {
      const url = request.nextUrl.clone();
      url.pathname = role === "inventory_manager" ? "/stock" : "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }

    // Inventory manager: only stock + vendors allowed, everything else → /stock.
    if (role === "inventory_manager" && !isInventoryManagerRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/stock";
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
    "/((?!_next/static|_next/image|api|favicon.ico|manifest.json|sw.js|workbox-|fallback-|icons/|uploads/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
