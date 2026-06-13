import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/supabase/env";
import { isWhatsAppConfigured, sendReport } from "@/lib/whatsapp";

/** Resolve the owner's WhatsApp number: app_settings first, then env fallback. */
async function getOwnerNumber(): Promise<string> {
  if (hasServiceRole()) {
    try {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "owner_whatsapp_number")
        .maybeSingle();
      const fromSettings = (data?.value || "").replace(/[^\d]/g, "");
      if (fromSettings) return fromSettings;
    } catch (err) {
      console.warn("Could not read owner WhatsApp number from settings:", err);
    }
  }
  return (process.env.OWNER_WHATSAPP_NUMBER || "").replace(/[^\d]/g, "");
}

/**
 * Send the owner a WhatsApp alert (via the approved template if
 * WHATSAPP_TEMPLATE_NAME is set, else plain text within the 24h window).
 *
 * Safe to call from any server action — it silently no-ops when WhatsApp isn't
 * configured or no owner number is set, and never throws.
 */
export async function notifyOwnerWhatsApp(message: string) {
  try {
    if (!isWhatsAppConfigured()) return;
    const to = await getOwnerNumber();
    if (!to) return;
    await sendReport(to, message);
  } catch (err) {
    console.error("WhatsApp owner notification failed:", err);
  }
}

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

// Convenience wrappers — one approved template ("🔔 {{1}}") carries each line.
export const whatsappNotify = {
  salesSubmitted: (staff: string, total: number) =>
    notifyOwnerWhatsApp(`Sales submitted by ${staff} — today's total ${inr(total)}.`),

  stockOut: (items: string[]) =>
    items.length
      ? notifyOwnerWhatsApp(`Stock alert — out of stock: ${items.join(", ")}.`)
      : Promise.resolve(),

  vendorOrder: (staff: string) =>
    notifyOwnerWhatsApp(`New vendor order raised by ${staff}.`),

  vendorPurchase: (staff: string, amount: number) =>
    notifyOwnerWhatsApp(`Purchase recorded by ${staff} — ${inr(amount)}.`),

  reimbursement: (staff: string, amount: number) =>
    notifyOwnerWhatsApp(`Reimbursement claim of ${inr(amount)} submitted by ${staff}.`),

  leaveRequest: (staff: string, type: string) =>
    notifyOwnerWhatsApp(`Leave request (${type.toUpperCase()}) submitted by ${staff}.`),

  checklistSubmitted: (staff: string, kind: "opening" | "closing") =>
    notifyOwnerWhatsApp(
      `${kind === "opening" ? "Opening" : "Closing"} checklist submitted by ${staff}.`,
    ),
};
