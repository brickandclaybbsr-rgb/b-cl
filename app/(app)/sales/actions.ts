"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { todayIST } from "@/lib/date";
import { toNumber, toInt } from "@/lib/utils";
import { whatsappNotify } from "@/lib/whatsapp-notify";
import { notifyOwner } from "@/lib/push";

export type SalesFormState = { ok?: boolean; error?: string };

export async function submitSales(
  _prev: SalesFormState,
  formData: FormData,
): Promise<SalesFormState> {
  const profile = await requireProfile();
  const supabase = createClient();
  const date = todayIST();

  const cash_sales = toNumber(formData.get("cash_sales"));
  const online_sales = toNumber(formData.get("online_sales"));
  const aggregator_sales = toNumber(formData.get("aggregator_sales"));

  const { error } = await supabase.from("daily_sales").insert({
    date,
    submitted_by: profile.id,
    cash_sales,
    online_sales,
    aggregator_sales,
    discount_amount: toNumber(formData.get("discount_amount")),
    complimentary_count: toInt(formData.get("complimentary_count")),
    complimentary_value: toNumber(formData.get("complimentary_value")),
    notes: String(formData.get("notes") ?? "").trim() || null,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Sales for today are already submitted." };
    }
    return { error: error.message };
  }

  await whatsappNotify.salesSubmitted(profile.name, cash_sales, online_sales, aggregator_sales);
  await notifyOwner.salesSubmitted(cash_sales + online_sales + aggregator_sales);

  revalidatePath("/sales");
  revalidatePath("/dashboard");
  revalidatePath("/owner");
  return { ok: true };
}
