import { NextResponse } from "next/server";
import { notifyStaff } from "@/lib/push";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await notifyStaff.openingChecklistReminder();
  await notifyStaff.attendanceReminder();
  return NextResponse.json({ ok: true });
}
