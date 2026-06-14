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

export async function getStaff(): Promise<Profile[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("role", { ascending: true })
    .order("name", { ascending: true });
  return data ?? [];
}
