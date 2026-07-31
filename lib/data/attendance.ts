import { createClient } from "@/lib/supabase/server";
import { todayIST } from "@/lib/date";

export interface TodayAttendanceRow {
  profileId: string;
  name: string;
  team: string | null;
  outletName: string | null;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  distanceM: number | null;
  onLeave: null | { type: "cl" | "sl" | "lwp"; reason: string };
}

export interface TodayAttendance {
  date: string;
  rows: TodayAttendanceRow[];
  checkedInCount: number;
  notCheckedInCount: number;
  onLeaveCount: number;
  checkedOutCount: number;
}

/**
 * Live attendance picture for today: who has scanned in, who has scanned out,
 * who is on approved leave, and who is still missing. House helpers are
 * excluded — they don't use QR attendance.
 */
export async function getTodayAttendance(): Promise<TodayAttendance> {
  const supabase = createClient();
  const date = todayIST();

  const [{ data: staff }, { data: checkins }, { data: leaves }, { data: outlets }] = await Promise.all([
    supabase.from("profiles").select("id,name,team,outlet_id,is_house_helper")
      .eq("role", "staff").eq("is_active", true),
    supabase.from("attendance_checkins").select("*").eq("date", date),
    supabase.from("leaves").select("profile_id,leave_type,reason")
      .eq("status", "approved").lte("start_date", date).gte("end_date", date),
    supabase.from("outlets").select("id,name"),
  ]);

  const outletName = Object.fromEntries((outlets ?? []).map((o: any) => [o.id, o.name]));
  const checkinBy = Object.fromEntries((checkins ?? []).map((c: any) => [c.profile_id, c]));
  const leaveBy = Object.fromEntries((leaves ?? []).map((l: any) => [l.profile_id, l]));

  const rows: TodayAttendanceRow[] = (staff ?? [])
    .filter((s: any) => !s.is_house_helper && !s.name?.toLowerCase().startsWith("reviewer."))
    .map((s: any) => {
      const ci = checkinBy[s.id];
      const lv = leaveBy[s.id];
      return {
        profileId: s.id,
        name: s.name,
        team: s.team ?? null,
        outletName: ci?.outlet_id ? outletName[ci.outlet_id] ?? null : (s.outlet_id ? outletName[s.outlet_id] ?? null : null),
        checkedInAt: ci?.checked_in_at ?? null,
        checkedOutAt: ci?.checked_out_at ?? null,
        distanceM: ci?.distance_m != null ? Number(ci.distance_m) : null,
        onLeave: lv ? { type: lv.leave_type, reason: lv.reason } : null,
      };
    })
    // Checked in first, then on leave, then missing.
    .sort((a, b) => {
      const rank = (r: TodayAttendanceRow) => (r.checkedInAt ? 0 : r.onLeave ? 1 : 2);
      return rank(a) - rank(b) || a.name.localeCompare(b.name);
    });

  return {
    date,
    rows,
    checkedInCount: rows.filter((r) => r.checkedInAt).length,
    checkedOutCount: rows.filter((r) => r.checkedOutAt).length,
    onLeaveCount: rows.filter((r) => !r.checkedInAt && r.onLeave).length,
    notCheckedInCount: rows.filter((r) => !r.checkedInAt && !r.onLeave).length,
  };
}
