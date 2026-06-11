/** Centralised, validated access to Supabase environment variables. */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * True when the public Supabase env is configured. Lets the UI degrade
 * gracefully (show a setup notice) instead of crashing before .env is filled.
 */
export function hasSupabaseEnv(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function getServiceRoleKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
}

export function hasServiceRole(): boolean {
  return Boolean(SUPABASE_URL && getServiceRoleKey());
}
