import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/supabase/env";
import { getCurrentProfile } from "@/lib/auth";
import { todayIST } from "@/lib/date";
import { gatherReportData, formatReportText } from "@/lib/eod-report";
import { sendReport, isWhatsAppConfigured } from "@/lib/whatsapp";
import { notifyOwner } from "@/lib/push";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function handle(req: NextRequest) {
  // ── Authorise: either the cron secret, or a signed-in owner ──────────────
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const isCron = Boolean(cronSecret) && authHeader === `Bearer ${cronSecret}`;

  let client: SupabaseClient<Database>;
  if (isCron) {
    if (!hasServiceRole()) {
      return NextResponse.json(
        { error: "Cron needs SUPABASE_SERVICE_ROLE_KEY to read data." },
        { status: 500 },
      );
    }
    client = createAdminClient();
  } else {
    const profile = await getCurrentProfile();
    if (!profile || profile.role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Owner RLS already grants full read; use admin if available for reliability.
    client = hasServiceRole() ? createAdminClient() : createClient();
  }

  if (!isWhatsAppConfigured()) {
    return NextResponse.json(
      { error: "WhatsApp is not configured (set WHATSAPP_ACCESS_TOKEN & WHATSAPP_PHONE_NUMBER_ID)." },
      { status: 400 },
    );
  }

  // ── Resolve recipient ────────────────────────────────────────────────────
  const { data: setting } = await client
    .from("app_settings")
    .select("value")
    .eq("key", "owner_whatsapp_number")
    .maybeSingle();
  const recipient = (setting?.value || process.env.OWNER_WHATSAPP_NUMBER || "").replace(
    /[^\d]/g,
    "",
  );
  if (!recipient) {
    return NextResponse.json(
      { error: "No owner WhatsApp number set (Settings → WhatsApp or OWNER_WHATSAPP_NUMBER)." },
      { status: 400 },
    );
  }

  // ── Build & send ─────────────────────────────────────────────────────────
  const date = todayIST();
  const data = await gatherReportData(client, date);
  const text = formatReportText(data);
  const result = await sendReport(recipient, text);

  // ── Log (best-effort) ────────────────────────────────────────────────────
  await client.from("eod_reports").insert({
    date,
    report_text: text,
    sent_to: recipient,
    status: result.ok ? "sent" : "failed",
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "WhatsApp send failed.", details: result.body },
      { status: 502 },
    );
  }

  await notifyOwner.eodReport();

  return NextResponse.json({
    ok: true,
    message: `Report sent to ${recipient} ✓`,
    trigger: isCron ? "cron" : "manual",
  });
}

// Vercel Cron uses GET; the in-app button uses POST.
export async function GET(req: NextRequest) {
  return handle(req);
}
export async function POST(req: NextRequest) {
  return handle(req);
}
