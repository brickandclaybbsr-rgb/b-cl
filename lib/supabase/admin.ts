import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { SUPABASE_URL, getServiceRoleKey } from "./env";

/**
 * Service-role client. Bypasses RLS — SERVER ONLY. Use for:
 *  - the EOD cron (no user session)
 *  - owner admin actions that create/manage staff accounts
 * Never import this into a Client Component.
 */
export function createAdminClient() {
  const key = getServiceRoleKey();
  if (!SUPABASE_URL || !key) {
    throw new Error(
      "Supabase service role is not configured (SUPABASE_SERVICE_ROLE_KEY).",
    );
  }
  return createSupabaseClient<Database>(SUPABASE_URL, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
