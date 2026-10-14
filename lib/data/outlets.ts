import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_OUTLET_ID } from "@/lib/constants";
import type { Profile } from "@/lib/database.types";

export type OutletOption = { id: string; name: string };

/** Cookie holding the outlet the owner last chose to view. */
export const ACTIVE_OUTLET_COOKIE = "bnc_outlet";

export async function getOutlets(): Promise<OutletOption[]> {
  const supabase = createClient();
  const { data } = await supabase.from("outlets").select("id, name").order("name");
  return (data ?? []) as OutletOption[];
}

export interface OutletContext {
  outlets: OutletOption[];
  activeId: string;
  active: OutletOption | null;
  /** Only the owner chooses which outlet to view; staff see their own. */
  canSwitch: boolean;
}

/**
 * Which outlet a screen should show daily records (sales, checklists, cash
 * outs) for. An explicit `?outlet=` wins, then — for the owner — the outlet
 * they last picked in the switcher (remembered across screens in a cookie),
 * then the person's assigned outlet. Anything that isn't a real outlet falls
 * back to the default.
 */
export async function getOutletContext(profile: Profile, requested?: string | null): Promise<OutletContext> {
  const outlets = await getOutlets();
  const canSwitch = profile.role === "owner";
  const isOutlet = (id?: string | null): id is string => !!id && outlets.some((o) => o.id === id);

  // Only the owner may look at an outlet other than their own. For everyone
  // else BOTH the query string and the cookie are ignored — otherwise a staff
  // member could read another branch's sales, checklists and cash outs just by
  // putting ?outlet=<other branch> in the address bar.
  const chosen = canSwitch
    ? [requested, cookies().get(ACTIVE_OUTLET_COOKIE)?.value]
    : [];

  const activeId = [...chosen, profile.outlet_id].find(isOutlet)
    ?? (isOutlet(DEFAULT_OUTLET_ID) ? DEFAULT_OUTLET_ID : outlets[0]?.id ?? DEFAULT_OUTLET_ID);

  return { outlets, activeId, active: outlets.find((o) => o.id === activeId) ?? null, canSwitch };
}
