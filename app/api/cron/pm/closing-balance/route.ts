import { NextResponse } from "next/server";
import { sendClosingBalanceReminderIfPending } from "@/lib/eod-cron";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await sendClosingBalanceReminderIfPending();
  return NextResponse.json({ ok: true });
}
