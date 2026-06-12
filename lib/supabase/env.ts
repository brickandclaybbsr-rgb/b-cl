/** Centralised, validated access to Supabase environment variables. */

/**
 * Sanitise an env-var value: trim whitespace and drop anything after the
 * first embedded newline or space.  This guards against copy-paste accidents
 * where e.g. SUPABASE_SERVICE_ROLE_KEY ends up set to
 * "<jwt>\nCRON_SECRET=xxx" which causes a "invalid header value" error.
 */
function sanitizeKey(raw: string | undefined): string {
  if (!raw) return "";
  // Take only the first non-empty token (stops at any whitespace / newline)
  return raw.split(/[\s\n\r]+/)[0] ?? "";
}

export const SUPABASE_URL = sanitizeKey(process.env.NEXT_PUBLIC_SUPABASE_URL);
export const SUPABASE_ANON_KEY = sanitizeKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/**
 * True when the public Supabase env is configured. Lets the UI degrade
 * gracefully (show a setup notice) instead of crashing before .env is filled.
 */
export function hasSupabaseEnv(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function getServiceRoleKey(): string {
  return sanitizeKey(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function hasServiceRole(): boolean {
  return Boolean(SUPABASE_URL && getServiceRoleKey());
}
