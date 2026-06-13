"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, requireOwner } from "@/lib/auth";
import type { OrderStatus, Urgency } from "@/lib/database.types";

export type OrderFormState = { ok?: boolean; error?: string };

export async function raiseOrder(
  _prev: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const profile = await requireProfile();
  const supabase = createClient();

  const vendorId = String(formData.get("vendor_id") ?? "");
  const items = String(formData.get("items") ?? "").trim();
  const urgency = (String(formData.get("urgency") ?? "normal") as Urgency);

  if (!vendorId) return { error: "Choose a vendor." };
  if (!items) return { error: "List the items needed." };

  const { error } = await supabase.from("vendor_orders").insert({
    vendor_id: vendorId,
    raised_by: profile.id,
    items,
    urgency: urgency === "urgent" ? "urgent" : "normal",
    status: "pending",
    notes: String(formData.get("notes") ?? "").trim() || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/vendors");
  revalidatePath("/owner");
  return { ok: true };
}

/** Owner-only: advance an order's status. */
export async function setOrderStatus(orderId: string, status: OrderStatus) {
  await requireOwner();
  const supabase = createClient();
  const { error } = await supabase
    .from("vendor_orders")
    .update({ status })
    .eq("id", orderId);
  if (error) return { error: error.message };

  revalidatePath("/vendors");
  revalidatePath("/owner");
  return { ok: true };
}
