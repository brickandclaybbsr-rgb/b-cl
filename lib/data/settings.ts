import { createClient } from "@/lib/supabase/server";
import type { ChecklistItemConfig } from "@/lib/database.types";

export async function getAppSetting(key: string): Promise<string> {
  const supabase = createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  return data?.value ?? "";
}

/** All checklist items of a type (incl. inactive) for the owner config screen. */
export async function getAllChecklistItems(
  type: "opening" | "closing",
): Promise<ChecklistItemConfig[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("checklist_items")
    .select("*")
    .eq("type", type)
    .order("sort_order", { ascending: true });
  return data ?? [];
}
