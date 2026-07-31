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

export interface MyAttendanceDay {
  date: string;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  outletName: string | null;
  leaveType: "cl" | "sl" | "lwp" | null;
  /** Days before this employee joined — never counted against them. */
  notEmployed: boolean;
}

export interface MyAttendance {
  today: MyAttendanceDay | null;
  days: MyAttendanceDay[];   // newest first
  presentCount: number;
  leaveCount: number;
  absentCount: number;
}

/**
 * One employee's own attendance record, newest first, from the QR rollout
 * onwards. Used on their dashboard (today) and profile (full history).
 */
export async function getMyAttendance(profileId: string, days = 60): Promise<MyAttendance> {
  const supabase = createClient();
  const today = todayIST();
  const from = new Date(new Date(today + "T00:00:00").getTime() - (days - 1) * 86_400_000)
    .toISOString().slice(0, 10);

  const [{ data: profile }, { data: checkins }, { data: leaves }, { data: outlets }] = await Promise.all([
    supabase.from("profiles").select("date_of_joining").eq("id", profileId).maybeSingle(),
    supabase.from("attendance_checkins").select("*").eq("profile_id", profileId).gte("date", from).lte("date", today),
    supabase.from("leaves").select("leave_type,start_date,end_date")
      .eq("profile_id", profileId).eq("status", "approved").lte("start_date", today).gte("end_date", from),
    supabase.from("outlets").select("id,name"),
  ]);

  const outletName = Object.fromEntries((outlets ?? []).map((o: any) => [o.id, o.name]));
  const ciBy = Object.fromEntries((checkins ?? []).map((c: any) => [c.date, c]));
  const joining = profile?.date_of_joining ?? null;

  const rows: MyAttendanceDay[] = [];
  for (let d = new Date(today + "T00:00:00"); d >= new Date(from + "T00:00:00"); d.setDate(d.getDate() - 1)) {
    const date = d.toISOString().slice(0, 10);
    const ci = ciBy[date];
    const lv = (leaves ?? []).find((l: any) => l.start_date <= date && l.end_date >= date);
    rows.push({
      date,
      checkedInAt: ci?.checked_in_at ?? null,
      checkedOutAt: ci?.checked_out_at ?? null,
      outletName: ci?.outlet_id ? outletName[ci.outlet_id] ?? null : null,
      leaveType: (lv?.leave_type as any) ?? null,
      notEmployed: !!joining && date < joining,
    });
  }

  const counted = rows.filter((r) => !r.notEmployed);
  return {
    today: rows.find((r) => r.date === today) ?? null,
    days: rows,
    presentCount: counted.filter((r) => r.checkedInAt).length,
    leaveCount: counted.filter((r) => !r.checkedInAt && r.leaveType).length,
    absentCount: counted.filter((r) => !r.checkedInAt && !r.leaveType).length,
  };
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
