import { requireProfile, isHeadChef } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import { NativeBootstrap } from "@/components/native-bootstrap";
import { CheckInScreen } from "@/components/attendance/checkin-screen";
import { createClient } from "@/lib/supabase/server";
import { todayIST } from "@/lib/date";
import { ATTENDANCE_ROLLOUT_DATE } from "@/lib/constants";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();

  // ── QR + geofence attendance gate ──────────────────────────────────────────
  // From the rollout date, on-site staff must scan an outlet QR (within its
  // geofence) before they can use the app. Owner & inventory manager are exempt.
  const gateApplies =
    profile.role === "staff" && todayIST() >= ATTENDANCE_ROLLOUT_DATE;

  if (gateApplies) {
    let checkedIn = false;
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("attendance_checkins")
        .select("id")
        .eq("profile_id", profile.id)
        .eq("date", todayIST())
        .maybeSingle();
      checkedIn = !!data;
    } catch (err) {
      // Fail open if the table isn't available yet, so staff aren't locked out
      // by an infrastructure issue. (Gate is dormant until the rollout date.)
      console.warn("Attendance gate check failed — allowing access:", err);
      checkedIn = true;
    }

    if (!checkedIn) {
      return (
        <>
          <NativeBootstrap />
          <CheckInScreen name={profile.name} />
        </>
      );
    }
  }

  return (
    <AppShell role={profile.role} name={profile.name} team={profile.team ?? null} isHeadChef={isHeadChef(profile)}>
      <NativeBootstrap />
      {children}
    </AppShell>
  );
}
