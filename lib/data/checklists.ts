import { createClient } from "@/lib/supabase/server";
import {
  OPENING_CHECKLIST,
  CLOSING_CHECKLIST,
  type ChecklistType,
  type ChecklistItemDef,
} from "@/lib/constants";
import type {
  OpeningChecklist,
  ClosingChecklist,
} from "@/lib/database.types";

/**
 * Active checklist item definitions for a given type. Reads the owner-editable
 * `checklist_items` table; falls back to the built-in defaults if empty.
 */
export async function getChecklistConfig(
  type: ChecklistType,
): Promise<ChecklistItemDef[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("checklist_items")
    .select("section, label")
    .eq("type", type)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) {
    return type === "opening" ? OPENING_CHECKLIST : CLOSING_CHECKLIST;
  }
  return data.map((d) => ({ section: d.section, label: d.label }));
}

export async function getOpeningChecklist(
  date: string,
): Promise<OpeningChecklist | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("opening_checklists")
    .select("*")
    .eq("date", date)
    .maybeSingle();
  return data ?? null;
}

export async function getClosingChecklist(
  date: string,
): Promise<ClosingChecklist | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("closing_checklists")
    .select("*")
    .eq("date", date)
    .maybeSingle();
  return data ?? null;
}

/** Group flat checklist lines by section, preserving order. */
export function groupBySection<T extends { section: string }>(
  items: T[],
): { section: string; items: T[] }[] {
  const out: { section: string; items: T[] }[] = [];
  for (const item of items) {
    let bucket = out.find((b) => b.section === item.section);
    if (!bucket) {
      bucket = { section: item.section, items: [] };
      out.push(bucket);
    }
    bucket.items.push(item);
  }
  return out;
}
