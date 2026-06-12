"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { getStockItems } from "@/lib/data/stock";
import { todayIST } from "@/lib/date";
import { notifyOwner } from "@/lib/push";
import type { StockLine, StockStatusValue } from "@/lib/database.types";

export type StockFormState = { ok?: boolean; error?: string };

const VALID: StockStatusValue[] = ["available", "low", "out"];

export async function submitStock(
  _prev: StockFormState,
  formData: FormData,
): Promise<StockFormState> {
  const profile = await requireProfile();
  const supabase = createClient();

  const items = await getStockItems();
  const lines: StockLine[] = items.map((item) => {
    const raw = String(formData.get(`status_${item.id}`) ?? "available");
    const status = (VALID.includes(raw as StockStatusValue)
      ? raw
      : "available") as StockStatusValue;

    const currentQtyStr = formData.get(`current_qty_${item.id}`);
    const current_qty = currentQtyStr ? parseFloat(String(currentQtyStr)) : undefined;
    const current_unit = String(formData.get(`current_unit_${item.id}`) ?? "").trim();

    const qtyRequiredStr = formData.get(`qty_required_${item.id}`);
    const qty_required = qtyRequiredStr ? parseFloat(String(qtyRequiredStr)) : undefined;
    const qty_required_unit = String(formData.get(`qty_required_unit_${item.id}`) ?? "").trim();

    const needed_by_date = String(formData.get(`needed_by_date_${item.id}`) ?? "").trim();
    const needed_by_time = String(formData.get(`needed_by_time_${item.id}`) ?? "").trim();
    const note = String(formData.get(`note_${item.id}`) ?? "").trim();

    return {
      item_id: item.id,
      item_name: item.name,
      status,
      ...(!isNaN(current_qty as any) && current_qty !== undefined ? { current_qty } : {}),
      ...(current_unit ? { current_unit } : {}),
      ...(!isNaN(qty_required as any) && qty_required !== undefined ? { qty_required } : {}),
      ...(qty_required_unit ? { qty_required_unit } : {}),
      ...(needed_by_date ? { needed_by_date } : {}),
      ...(needed_by_time ? { needed_by_time } : {}),
      ...(note ? { note } : {}),
    };
  });

  const { error } = await supabase.from("stock_snapshots").insert({
    date: todayIST(),
    submitted_by: profile.id,
    items: lines,
  });

  if (error) return { error: error.message };

  for (const line of lines.filter((l) => l.status === "out")) {
    await notifyOwner.stockAlert(line.item_name);
  }

  revalidatePath("/stock");
  revalidatePath("/owner");
  return { ok: true };
}

export async function addStockItemInline(name: string, category: string) {
  await requireProfile();
  const supabase = createClient();

  if (!name.trim()) return { error: "Item name cannot be empty." };

  const { data, error } = await supabase
    .from("stock_items")
    .insert({
      name: name.trim(),
      category: category.trim() || "Other",
      is_active: true,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/stock");
  revalidatePath("/settings");
  return { ok: true, item: data };
}
