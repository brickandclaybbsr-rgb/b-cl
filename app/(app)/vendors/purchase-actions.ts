"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { uploadPublicFile } from "@/lib/storage";
import type { StockLine } from "@/lib/database.types";

export type PurchaseFormState = { ok?: boolean; error?: string };

type PurchaseLine = {
  item_id: string;
  item_name: string;
  custom_name: string;
  qty: string;
  unit: string;
};

export async function recordPurchase(
  _prev: PurchaseFormState,
  formData: FormData,
): Promise<PurchaseFormState> {
  const profile = await requireProfile();
  const supabase = createClient();

  const vendorId    = String(formData.get("vendor_id")    ?? "");
  const amountStr   = String(formData.get("amount")       ?? "").trim();
  const notes       = String(formData.get("notes")        ?? "").trim();
  const purchasedAt = String(formData.get("purchased_at") ?? "").trim();

  if (!vendorId) return { error: "Choose a vendor." };

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount < 0) return { error: "Invalid purchase amount." };

  // Parse structured items
  let lines: PurchaseLine[] = [];
  try {
    lines = JSON.parse(String(formData.get("structured_items") ?? "[]"));
  } catch { /* keep empty */ }

  const validLines = lines.filter(l => l.qty && parseFloat(l.qty) > 0 && (l.item_id || l.custom_name.trim()));
  if (validLines.length === 0) return { error: "Add at least one item with a quantity." };

  // Human-readable items string for the purchase log
  const itemsText = validLines
    .map(l => `${l.qty} ${l.unit} ${l.item_id ? l.item_name : l.custom_name}`)
    .join(", ");

  // Upload invoice bill
  const file = formData.get("bill") as File;
  let billUrl = "";
  if (file && file.size > 0) {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      billUrl = await uploadPublicFile("bills", filename, buffer, file.type || "application/octet-stream");
    } catch (err: any) {
      return { error: "Failed to upload invoice bill: " + err.message };
    }
  }

  // Save purchase record
  const { error: purchaseErr } = await supabase.from("purchases").insert({
    vendor_id:    vendorId,
    submitted_by: profile.id,
    items:        itemsText,
    amount,
    bill_url:     billUrl || null,
    notes:        notes || null,
    purchased_at: purchasedAt ? new Date(purchasedAt).toISOString() : new Date().toISOString(),
  });
  if (purchaseErr) return { error: purchaseErr.message };

  // ── Auto-update stock snapshot ──────────────────────────────────────────
  const stockLines = validLines.filter(l => l.item_id);
  if (stockLines.length > 0) {
    // Get latest snapshot
    const { data: latestSnap } = await supabase
      .from("stock_snapshots")
      .select("*")
      .order("date", { ascending: false })
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get stock items for min_qty reference
    const { data: stockItems } = await supabase
      .from("stock_items")
      .select("id, name, min_qty, min_unit")
      .eq("is_active", true);
    const stockItemMap: Record<string, { name: string; min_qty: number | null }> = {};
    (stockItems ?? []).forEach(s => { stockItemMap[s.id] = { name: s.name, min_qty: s.min_qty }; });

    // Build item map from latest snapshot
    const itemMap: Record<string, StockLine> = {};
    ((latestSnap?.items ?? []) as StockLine[]).forEach(line => {
      itemMap[line.item_id] = { ...line };
    });

    // Apply purchased quantities
    for (const line of stockLines) {
      const purchasedQty = parseFloat(line.qty);
      if (isNaN(purchasedQty) || purchasedQty <= 0) continue;

      const existing = itemMap[line.item_id];
      const stockItem = stockItemMap[line.item_id];

      if (existing) {
        const newQty = (existing.current_qty ?? 0) + purchasedQty;
        // Upgrade status: if out/low and now has stock, mark available
        let newStatus = existing.status;
        if (newQty > 0 && (newStatus === "out")) newStatus = "available";
        if (newQty > 0 && stockItem?.min_qty != null && newQty >= stockItem.min_qty) newStatus = "available";
        itemMap[line.item_id] = {
          ...existing,
          current_qty:  newQty,
          current_unit: line.unit,
          status:       newStatus,
          note:         `+${purchasedQty}${line.unit} via purchase`,
        };
      } else {
        // Item not previously tracked — add it fresh
        itemMap[line.item_id] = {
          item_id:           line.item_id,
          item_name:         line.item_name,
          status:            "available",
          current_qty:       purchasedQty,
          current_unit:      line.unit,
          qty_required:      0,
          qty_required_unit: line.unit,
          needed_by_date:    "",
          needed_by_time:    "",
          note:              "Added via purchase",
        };
      }
    }

    // Save updated snapshot for today
    const today = new Date().toISOString().split("T")[0];
    await supabase.from("stock_snapshots").insert({
      date:         today,
      submitted_by: profile.id,
      items:        Object.values(itemMap),
    });
  }

  revalidatePath("/vendors");
  revalidatePath("/stock");
  revalidatePath("/owner");
  return { ok: true };
}

export async function addVendorFromPurchase(
  name: string,
  contact: string,
): Promise<PurchaseFormState> {
  await requireProfile();
  const supabase = createClient();
  if (!name.trim()) return { error: "Vendor name is required." };
  const { error } = await supabase.from("vendors").insert({
    name:    name.trim(),
    contact: contact.trim() || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/vendors");
  return { ok: true };
}
