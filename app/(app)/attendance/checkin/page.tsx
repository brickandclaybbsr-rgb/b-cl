import { requireProfile } from "@/lib/auth";
import { CheckInScreen } from "@/components/attendance/checkin-screen";

export const metadata = { title: "Scan QR" };

/**
 * QR scan screen, opened from the centre button in the staff bottom bar.
 * Scanning marks attendance (and is the home for future scan-based actions).
 */
export default async function CheckInPage() {
  const profile = await requireProfile();
  return <CheckInScreen name={profile.name} redirectTo="/dashboard" embedded />;
}
