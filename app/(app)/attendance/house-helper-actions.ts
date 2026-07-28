"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/auth";
import { todayIST } from "@/lib/date";

export type HouseHelperActionState = { ok?: boolean; error?: string; message?: string };

/** Record a day's cash payment to a house helper (owner only). */
export async function addHouseHelperPayment(
  _prev: HouseHelperActionState,
  formData: FormData,
): Promise<HouseHelperActionState> {
  try {
    const owner = await requireOwner();
    const supabase = createClient();

    const profileId = String(formData.get("profileId") ?? "").trim();
    const amountRaw = String(formData.get("amount") ?? "").trim();
    const dateRaw = String(formData.get("date") ?? "").trim();
    const remarks = String(formData.get("remarks") ?? "").trim();

    const amount = parseFloat(amountRaw);
    if (!profileId) return { error: "Missing employee." };
    if (!amountRaw || isNaN(amount) || amount <= 0) return { error: "Please enter a valid amount." };

    const today = todayIST();
    const date = dateRaw && dateRaw <= today ? dateRaw : today;

    const { error } = await supabase.from("house_helper_payments").insert({
      profile_id: profileId,
      date,
      amount,
      remarks: remarks || null,
      recorded_by: owner.id,
    });

    if (error) return { error: error.message };
    revalidatePath("/attendance");
    return { ok: true, message: "Payment recorded." };
  } catch (err: any) {
    console.error("addHouseHelperPayment exception:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}

/** Delete a house-helper payment entry (owner only). */
export async function deleteHouseHelperPayment(id: string): Promise<HouseHelperActionState> {
  try {
    await requireOwner();
    const supabase = createClient();
    const { error } = await supabase.from("house_helper_payments").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/attendance");
    return { ok: true };
  } catch (err: any) {
    console.error("deleteHouseHelperPayment exception:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}
