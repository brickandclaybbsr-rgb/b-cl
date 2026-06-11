import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/database.types";

/** Map of profile id → name, for resolving "submitted_by" references. */
export async function getProfileNameMap(): Promise<Record<string, string>> {
  const supabase = createClient();
  const { data } = await supabase.from("profiles").select("id, name");
  const map: Record<string, string> = {};
  (data ?? []).forEach((p) => {
    map[p.id] = p.name;
  });
  return map;
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
