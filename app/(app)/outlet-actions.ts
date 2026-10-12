"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth";
import { ACTIVE_OUTLET_COOKIE, getOutlets } from "@/lib/data/outlets";

/** Remember which outlet the owner is viewing, across every screen. */
export async function setActiveOutlet(outletId: string): Promise<{ ok?: boolean; error?: string }> {
  await requireOwner();
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
