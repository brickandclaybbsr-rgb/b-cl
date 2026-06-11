"use server";

import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export type PurchaseFormState = { ok?: boolean; error?: string };

export async function recordPurchase(
  _prev: PurchaseFormState,
  formData: FormData,
): Promise<PurchaseFormState> {
  const profile = await requireProfile();
  const supabase = createClient();

  const vendorId = String(formData.get("vendor_id") ?? "");
  const items = String(formData.get("items") ?? "").trim();
  const amountStr = String(formData.get("amount") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const purchasedAt = String(formData.get("purchased_at") ?? "").trim();
  
  if (!vendorId) return { error: "Choose a vendor." };
  if (!items) return { error: "List the items purchased." };
  
  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount < 0) {
    return { error: "Invalid purchase amount." };
  }

  // Handle local file upload
  const file = formData.get("bill") as File;
  let billUrl = "";
  if (file && file.size > 0) {
    try {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const publicDir = path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(publicDir, { recursive: true });
      const filePath = path.join(publicDir, filename);
      await fs.writeFile(filePath, buffer);
      billUrl = `/uploads/${filename}`;
    } catch (err: any) {
      console.error("File upload failed:", err);
      return { error: "Failed to upload invoice bill: " + err.message };
    }
  }

  const { error } = await supabase.from("purchases").insert({
    vendor_id: vendorId,
    submitted_by: profile.id,
    items,
    amount,
    bill_url: billUrl || null,
    notes: notes || null,
    purchased_at: purchasedAt ? new Date(purchasedAt).toISOString() : new Date().toISOString(),
  });

  if (error) return { error: error.message };

  revalidatePath("/vendors");
  revalidatePath("/owner");
  return { ok: true };
}
