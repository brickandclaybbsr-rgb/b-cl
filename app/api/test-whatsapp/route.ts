import { notifyOwnerWhatsApp } from "@/lib/whatsapp-notify";
import { requireProfile } from "@/lib/auth";

export async function GET() {
  try {
    const profile = await requireProfile();
    if (profile.role !== "owner") {
      return Response.json({ error: "Owner only" }, { status: 403 });
    }
    await notifyOwnerWhatsApp("✅ WhatsApp is connected! Brick and Clay Operations notifications are live.");
    return Response.json({ ok: true, message: "Test message sent — check your WhatsApp." });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
