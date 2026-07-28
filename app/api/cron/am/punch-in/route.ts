import { NextResponse } from "next/server";
import { remindStaffAboutAttendance } from "@/lib/attendance-reminder";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Attendance reminder sweep. Runs several times across the 11:30–23:30 IST
 * shift; each run notifies only the staff who still haven't checked in (and,
 * near the end of the shift, those who haven't checked out).
 */
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await remindStaffAboutAttendance();
  return NextResponse.json({ ok: true, ...result });
}
