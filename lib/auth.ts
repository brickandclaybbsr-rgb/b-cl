import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/database.types";

/** Head chef — full nav access + can edit submitted kitchen checklists. */
export function isHeadChef(profile: Profile): boolean {
  return profile.team === "head_chef";
}

/** Inventory manager — can only access the stock/inventory page. */
export function isInventoryManager(profile: Profile): boolean {
  return profile.role === "inventory_manager";
}

/** Current authenticated profile, or null. Safe to call anywhere server-side. */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile ?? null;
}

/** Require any signed-in active profile, else redirect to /login. */
export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.is_active) redirect("/login?error=inactive");
  return profile;
}

/** Require an owner. Staff are bounced to their dashboard. */
export async function requireOwner(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "owner") redirect("/dashboard");
  return profile;
}
