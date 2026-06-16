import { sendWhatsAppTemplate, sendWhatsAppText, isWhatsAppConfigured } from "@/lib/whatsapp";
import { requireProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const profile = await requireProfile();
    if (profile.role !== "owner") {
      return Response.json({ error: "Owner only" }, { status: 403 });
    }

    const configured = isWhatsAppConfigured();
    const token = process.env.WHATSAPP_ACCESS_TOKEN ?? "";
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID ?? "";
    const templateName = process.env.WHATSAPP_TEMPLATE_NAME ?? "";
    const ownerNumber = (process.env.OWNER_WHATSAPP_NUMBER ?? "").replace(/[^\d]/g, "");

    // Also try reading owner number from db
    let dbNumber = "";
    try {
      const supabase = createAdminClient();
      const { data } = await supabase.from("app_settings").select("value").eq("key", "owner_whatsapp_number").maybeSingle();
      dbNumber = (data?.value || "").replace(/[^\d]/g, "");
    } catch {}

    const to = dbNumber || ownerNumber;

    const debug = {
      configured,
      hasToken: token.length > 0,
      tokenPrefix: token.slice(0, 20) + "...",
      phoneId,
      templateName,
      ownerNumberEnv: ownerNumber,
      ownerNumberDb: dbNumber,
      sendingTo: to,
    };

    if (!to) {
      return Response.json({ error: "No owner WhatsApp number set", debug });
    }

    const result = await sendWhatsAppTemplate(
      to,
      "✅ WhatsApp test from Brick and Clay Operations — notifications are live!",
      templateName || undefined,
    );

    return Response.json({ result, debug });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
