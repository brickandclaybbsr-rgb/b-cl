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

/** Resolve the owner's first name from profiles (role=owner) or fall back to "there". */
async function getOwnerName(): Promise<string> {
  if (hasServiceRole()) {
    try {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from("profiles")
        .select("name")
        .eq("role", "owner")
        .maybeSingle();
      if (data?.name) return data.name.split(" ")[0];
    } catch (err) {
      console.warn("Could not fetch owner name:", err);
    }
  }
  return "there";
}

/**
 * Send the owner a WhatsApp alert.
 * Prepends "Hey [Owner]," and appends "Brick and Clay Operations" automatically.
 * Safe to call from any server action — silently no-ops when WhatsApp isn't
 * configured or no owner number is set, and never throws.
 */
export async function notifyOwnerWhatsApp(body: string) {
  try {
    if (!isWhatsAppConfigured()) return;
    const to = await getOwnerNumber();
    if (!to) return;
    const ownerName = await getOwnerName();
    const message = `Hey ${ownerName},\n\n${body}\n\nBrick and Clay Operations`;
    await sendReport(to, message);
  } catch (err) {
    console.error("WhatsApp owner notification failed:", err);
  }
}

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const LEAVE_LABELS: Record<string, string> = {
  cl: "Casual Leave (CL)",
  sl: "Sick Leave (SL)",
  lwp: "Leave Without Pay (LWP)",
};

function fmtDate(dateStr: string): string {
  const dt = new Date(dateStr + "T00:00:00");
  if (isNaN(dt.getTime())) return dateStr;
  return dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export const whatsappNotify = {
  salesSubmitted: (staff: string, cash: number, online: number, aggregator: number) => {
    const total = cash + online + aggregator;
    return notifyOwnerWhatsApp(
      `Sales submitted by ${staff}:\n` +
      `  Cash: ${inr(cash)}\n` +
      `  Online: ${inr(online)}\n` +
      `  Aggregator: ${inr(aggregator)}\n` +
      `  Total: ${inr(total)}`,
    );
  },

  reimbursement: (staff: string, amount: number) =>
    notifyOwnerWhatsApp(`Reimbursement claim of ${inr(amount)} submitted by ${staff}.`),

  leaveRequest: (staff: string, type: string, startDate: string, endDate: string) =>
    notifyOwnerWhatsApp(
      `Leave request by ${staff}:\n` +
      `  Type: ${LEAVE_LABELS[type] ?? type.toUpperCase()}\n` +
      `  From: ${fmtDate(startDate)}\n` +
      `  To: ${fmtDate(endDate)}`,
    ),

  checklistSubmitted: (staff: string, kind: "opening" | "closing") =>
    notifyOwnerWhatsApp(
      `${kind === "opening" ? "Opening" : "Closing"} checklist submitted by ${staff}.`,
    ),
};
