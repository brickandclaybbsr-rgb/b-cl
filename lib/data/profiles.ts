import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/database.types";

/** Map of profile id → name, for resolving "submitted_by" references.
 *  Uses admin client so staff users can resolve names across all profiles. */
export async function getProfileNameMap(): Promise<Record<string, string>> {
  const run = async (client: ReturnType<typeof createClient>) => {
    const { data } = await client.from("profiles").select("id, name");
    const map: Record<string, string> = {};
    (data ?? []).forEach((p) => { map[p.id] = p.name; });
    return map;
  };
  try { return await run(createAdminClient() as any); }
  catch { return await run(createClient()); }
}

/**
 * Staff for the working screens — attendance, expenses, sales, profile.
 *
 * Deactivated people are left out by default: once someone has left, they
 * should not keep appearing on the attendance ledger with an empty month, nor
 * in a cash-expense or sales dropdown where they could still be picked.
 *
 * `includeInactive` is for the People tab, which has to keep listing them —
 * it is the only place to view a leaver's documents or switch them back on,
 * so filtering there would make deactivation a one-way door.
 */
export async function getStaff(
  opts: { includeInactive?: boolean } = {},
): Promise<Profile[]> {
  const supabase = createClient();
  let query = supabase.from("profiles").select("*");
  if (!opts.includeInactive) query = query.eq("is_active", true);
  const { data } = await query
    .order("role", { ascending: true })
    .order("name", { ascending: true });
  return data ?? [];
}
