import { requireProfile } from "@/lib/auth";
import { CheckInScreen } from "@/components/attendance/checkin-screen";

export const metadata = { title: "Check In" };

/**
 * Direct check-in screen — reachable at /attendance/checkin for any signed-in
 * user, regardless of the attendance gate. Useful for testing the QR + geofence
 * scan flow before the app-wide rollout.
 */
export default async function CheckInPage() {
  const profile = await requireProfile();
  return <CheckInScreen name={profile.name} />;
}
