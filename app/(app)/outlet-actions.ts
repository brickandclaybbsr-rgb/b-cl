"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { ACTIVE_OUTLET_COOKIE, canViewAllOutlets, getOutlets } from "@/lib/data/outlets";

/**
 * Remember which outlet the viewer is looking at, across every screen.
 *
 * Owner and head chef only — this used to call requireOwner(), which redirects
 * rather than returning, so a head chef switching branch was bounced to the
 * dashboard instead of being told no.
 */
export async function setActiveOutlet(outletId: string): Promise<{ ok?: boolean; error?: string }> {
  const profile = await requireProfile();
  if (!canViewAllOutlets(profile)) {
    return { error: "You can only work in your own outlet." };
  }
  const outlets = await getOutlets();
  if (!outlets.some((o) => o.id === outletId)) return { error: "Unknown outlet." };

  cookies().set(ACTIVE_OUTLET_COOKIE, outletId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
  return { ok: true };
}
