"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { todayIST, daysAgoIST, formatDateLabel } from "@/lib/date";
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
  const today = todayIST();
  const windowStart = daysAgoIST(6);
  const requested = String(formData.get("_date") ?? "").trim();
  // Allow any date in the last 7 days — block future dates and anything older
  const date = (requested >= windowStart && requested <= today) ? requested : today;

  const opening_cash        = toNumber(formData.get("opening_cash"));
  const cash_sales          = toNumber(formData.get("cash_sales"));
  const card_sales          = toNumber(formData.get("card_sales"));
  const upi_sales           = toNumber(formData.get("upi_sales"));
  const zomato_gold_sales   = toNumber(formData.get("zomato_gold_sales"));
  const zomato_sales        = toNumber(formData.get("zomato_sales"));
  const swiggy_sales        = toNumber(formData.get("swiggy_sales"));
  const swiggy_dineout_sales = toNumber(formData.get("swiggy_dineout_sales"));
  const eazy_diner_sales    = toNumber(formData.get("eazy_diner_sales"));
  const closing_balance     = toNumber(formData.get("closing_balance"));

  const online_sales     = card_sales + upi_sales;
  const aggregator_sales = zomato_gold_sales + zomato_sales + swiggy_sales + swiggy_dineout_sales + eazy_diner_sales;

  const { error } = await supabase.from("daily_sales").insert({
    date,
    submitted_by: profile.id,
    opening_cash,
    cash_sales,
    card_sales,
    upi_sales,
    online_sales,
    zomato_gold_sales,
    zomato_sales,
    swiggy_sales,
    swiggy_dineout_sales,
    eazy_diner_sales,
    aggregator_sales,
    closing_balance,
    discount_amount: toNumber(formData.get("discount_amount")),
    complimentary_count: toInt(formData.get("complimentary_count")),
    complimentary_value: toNumber(formData.get("complimentary_value")),
    notes: String(formData.get("notes") ?? "").trim() || null,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: `Sales for ${date === today ? "today" : formatDateLabel(date)} are already submitted.` };
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
