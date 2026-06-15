import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

/** Map team slug → checklist section prefixes it owns. */
const TEAM_SECTIONS: Record<string, string[]> = {
  kitchen: ["Kitchen"],
  front_desk: ["Front Desk", "Staff"],
};

/**
 * Active checklist item definitions for a given type.
 * When `team` is provided only that team's sections are returned.
 * Falls back to full list for owner or unassigned staff.
 */
export async function getChecklistConfig(
  type: ChecklistType,
  team?: "kitchen" | "front_desk" | null,
): Promise<ChecklistItemDef[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("checklist_items")
    .select("section, label")
    .eq("type", type)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const all: ChecklistItemDef[] =
    error || !data || data.length === 0
      ? type === "opening"
        ? OPENING_CHECKLIST
        : CLOSING_CHECKLIST
      : data.map((d) => ({ section: d.section, label: d.label }));

  if (!team) return all;

  const owned = TEAM_SECTIONS[team] ?? [];
  return all.filter((item) =>
    owned.some((prefix) => item.section.startsWith(prefix))
  );
}

/**
 * Returns sections that belong to the OTHER team — used when that team is
 * absent and tasks fall to the current staff member.
 */
export async function getOtherTeamConfig(
  type: ChecklistType,
  team: "kitchen" | "front_desk",
): Promise<ChecklistItemDef[]> {
  const other = team === "kitchen" ? "front_desk" : "kitchen";
  return getChecklistConfig(type, other);
}

/** Check if any staff from `otherTeam` have an approved/pending leave today. */
export async function isOtherTeamAbsentToday(
  currentTeam: "kitchen" | "front_desk",
): Promise<boolean> {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);
  const otherTeam = currentTeam === "kitchen" ? "front_desk" : "kitchen";

  const { data: absentProfiles } = await supabase
    .from("profiles")
    .select("id")
    .eq("team", otherTeam)
    .eq("is_active", true);

  if (!absentProfiles || absentProfiles.length === 0) return false;

  const ids = absentProfiles.map((p) => p.id);
  const { data: leaves } = await supabase
    .from("leaves")
    .select("id")
    .in("profile_id", ids)
    .in("status", ["approved", "pending"])
    .lte("start_date", today)
    .gte("end_date", today)
    .limit(1);

  return Boolean(leaves && leaves.length > 0);
}

async function fetchChecklist<T>(
  table: "opening_checklists" | "closing_checklists",
  date: string,
  team?: string | null,
): Promise<T | null> {
  const run = async (client: ReturnType<typeof createAdminClient> | ReturnType<typeof createClient>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q = (client as any).from(table).select("*").eq("date", date);
    if (team !== undefined) q = q.eq("team", team ?? "all");
    const { data } = await q.order("submitted_at", { ascending: true });
    return (data as T[] | null)?.[0] ?? null;
  };
  try {
    return await run(createAdminClient());
  } catch {
    return await run(createClient());
  }
}

/**
 * Get an opening checklist for a date.
 * - Pass `team` to get only that team's record.
 * - Omit `team` to get any record (first submitted, for owner/dashboard).
 */
export async function getOpeningChecklist(
  date: string,
  team?: string | null,
): Promise<OpeningChecklist | null> {
  return fetchChecklist<OpeningChecklist>("opening_checklists", date, team);
}

export async function getClosingChecklist(
  date: string,
  team?: string | null,
): Promise<ClosingChecklist | null> {
  return fetchChecklist<ClosingChecklist>("closing_checklists", date, team);
}

/** All filed closing dates for a team within a date range — used to find missing dates. */
export async function getClosingRange(
  from: string,
  to: string,
  team: string,
): Promise<{ date: string }[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("closing_checklists")
    .select("date")
    .gte("date", from)
    .lte("date", to)
    .eq("team", team)
    .order("date", { ascending: true });
  return data ?? [];
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
