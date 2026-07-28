import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/supabase/env";
import { sendPushToProfile } from "@/lib/push";
import { todayIST, nowIST } from "@/lib/date";
import { ATTENDANCE_ROLLOUT_DATE } from "@/lib/constants";

/** Business hours (IST): staff are expected on shift 11:30 – 23:30. */
export const SHIFT_START_HOUR = 11.5;
export const SHIFT_END_HOUR = 23.5;

type Reminded = { remindedCheckIn: number; remindedCheckOut: number; skipped: string };

/**
 * Remind only the staff who actually still need to act:
 *  - not checked in yet  → "mark your attendance"
 *  - checked in but not out, and the shift is ending → "check out"
 *
 * Blasting every staff member (the old behaviour) trained people to ignore the
 * notification, so this targets individuals via sendPushToProfile.
 */
export async function remindStaffAboutAttendance(): Promise<Reminded> {
  const none: Reminded = { remindedCheckIn: 0, remindedCheckOut: 0, skipped: "" };

  if (!hasServiceRole()) return { ...none, skipped: "no service role configured" };

  const date = todayIST();
  // Gate is dormant until rollout — don't nag people about a flow that isn't live.
  if (date < ATTENDANCE_ROLLOUT_DATE) {
    return { ...none, skipped: `before rollout (${ATTENDANCE_ROLLOUT_DATE})` };
  }

  const supabase = createAdminClient();

  // Staff who are expected to use QR attendance.
  const { data: staff } = await supabase
    .from("profiles")
    .select("id, name, is_house_helper")
    .eq("role", "staff")
    .eq("is_active", true);

  if (!staff?.length) return { ...none, skipped: "no active staff" };

  const expected = staff.filter((s: any) => !s.is_house_helper);
  if (!expected.length) return { ...none, skipped: "no staff use QR attendance" };

  const { data: checkins } = await supabase
    .from("attendance_checkins")
    .select("profile_id, checked_out_at")
    .eq("date", date);

  const byProfile = new Map<string, { checked_out_at: string | null }>();
  for (const c of checkins ?? []) {
    byProfile.set((c as any).profile_id, { checked_out_at: (c as any).checked_out_at });
  }

  // Decimal hour in IST, e.g. 23.5 for 23:30.
  const now = nowIST();
  const hour = now.getHours() + now.getMinutes() / 60;
  const shiftEnding = hour >= SHIFT_END_HOUR - 0.75; // last ~45 min of the shift

  let remindedCheckIn = 0;
  let remindedCheckOut = 0;

  for (const s of expected as any[]) {
    const entry = byProfile.get(s.id);

    if (!entry) {
      // Only nag during business hours.
      if (hour < SHIFT_START_HOUR || hour > SHIFT_END_HOUR) continue;
      await sendPushToProfile(
        s.id,
        "🕐 Mark your attendance",
        "You haven't marked your attendance yet. Scan the outlet QR to check in.",
        "/attendance/checkin",
      );
      remindedCheckIn++;
      continue;
    }

    if (!entry.checked_out_at && shiftEnding) {
      await sendPushToProfile(
        s.id,
        "👋 Don't forget to check out",
        "Your shift is ending. Scan the outlet QR to check out.",
        "/attendance/checkin",
      );
      remindedCheckOut++;
    }
  }

  return { remindedCheckIn, remindedCheckOut, skipped: "" };
}
