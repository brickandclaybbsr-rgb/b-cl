import { NextResponse } from "next/server";
import { remindStaffAboutAttendance } from "@/lib/attendance-reminder";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * End-of-shift sweep (runs 22:30–23:30 IST). Nudges anyone still checked in to
 * scan out, and anyone who never checked in at all while the shift is open.
 */
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await remindStaffAboutAttendance();
  return NextResponse.json({ ok: true, ...result });
}
