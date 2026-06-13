import { NextResponse } from "next/server";
import { sendPushToOwner } from "@/lib/push";
import { requireOwner } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    await requireOwner();
    await sendPushToOwner(
      "🔔 Test Notification",
      "Push notifications are working!",
      "/owner",
    );
    return NextResponse.json({ ok: true, message: "Test push sent." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
