"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { uploadPublicFile } from "@/lib/storage";
import { whatsappNotify } from "@/lib/whatsapp-notify";

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

  // Upload invoice bill to Supabase Storage (works on serverless/Vercel)
  const file = formData.get("bill") as File;
  let billUrl = "";
  if (file && file.size > 0) {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      billUrl = await uploadPublicFile(
        "bills",
        filename,
        buffer,
        file.type || "application/octet-stream",
      );
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

  await whatsappNotify.vendorPurchase(profile.name, amount);

  revalidatePath("/vendors");
  revalidatePath("/owner");
  return { ok: true };
}
