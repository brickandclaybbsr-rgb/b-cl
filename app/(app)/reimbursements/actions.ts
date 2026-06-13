"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, requireOwner } from "@/lib/auth";
import { uploadPublicFile } from "@/lib/storage";
import { whatsappNotify } from "@/lib/whatsapp-notify";

export type ReimbursementFormState = { ok?: boolean; error?: string };

export async function submitReimbursementClaim(
  _prev: ReimbursementFormState,
  formData: FormData,
): Promise<ReimbursementFormState> {
  const profile = await requireProfile();
  const supabase = createClient();

  const amountStr = String(formData.get("amount") ?? "").trim();
  const purpose = String(formData.get("purpose") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!purpose) return { error: "State the purpose of the expense." };
  
  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    return { error: "Please enter a valid expense amount." };
  }

  // Upload receipt to Supabase Storage (works on serverless/Vercel)
  const file = formData.get("receipt") as File;
  let receiptUrl = "";
  if (file && file.size > 0) {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      receiptUrl = await uploadPublicFile(
        "receipts",
        filename,
        buffer,
        file.type || "application/octet-stream",
      );
    } catch (err: any) {
      console.error("Receipt upload failed:", err);
      return { error: "Failed to upload receipt: " + err.message };
    }
  }

  const { error } = await supabase.from("reimbursements").insert({
    submitted_by: profile.id,
    amount,
    purpose,
    receipt_url: receiptUrl || null,
    notes: notes || null,
    status: "pending",
  });

  if (error) return { error: error.message };

  await whatsappNotify.reimbursement(profile.name, amount);

  revalidatePath("/reimbursements");
  return { ok: true };
}

export async function approveClaim(claimId: string) {
  try {
    const profile = await requireOwner();
    const supabase = createClient();

    const { error } = await supabase
      .from("reimbursements")
      .update({
        status: "approved",
        processed_by: profile.id,
        processed_at: new Date().toISOString(),
      })
      .eq("id", claimId);

    if (error) {
      console.error("approveClaim DB error:", error);
      return { error: error.message };
    }

    revalidatePath("/reimbursements");
    revalidatePath("/owner");
    return { ok: true };
  } catch (err: any) {
    console.error("approveClaim exception:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}

export async function rejectClaim(claimId: string) {
  try {
    const profile = await requireOwner();
    const supabase = createClient();

    const { error } = await supabase
      .from("reimbursements")
      .update({
        status: "rejected",
        processed_by: profile.id,
        processed_at: new Date().toISOString(),
      })
      .eq("id", claimId);

    if (error) {
      console.error("rejectClaim DB error:", error);
      return { error: error.message };
    }

    revalidatePath("/reimbursements");
    revalidatePath("/owner");
    return { ok: true };
  } catch (err: any) {
    console.error("rejectClaim exception:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}

export async function markClaimPaid(claimId: string) {
  try {
    const profile = await requireOwner();
    const supabase = createClient();

    const { error } = await supabase
      .from("reimbursements")
      .update({
        status: "paid",
        processed_by: profile.id,
        processed_at: new Date().toISOString(),
      })
      .eq("id", claimId);

    if (error) {
      console.error("markClaimPaid DB error:", error);
      return { error: error.message };
    }

    revalidatePath("/reimbursements");
    revalidatePath("/owner");
    return { ok: true };
  } catch (err: any) {
    console.error("markClaimPaid exception:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}
