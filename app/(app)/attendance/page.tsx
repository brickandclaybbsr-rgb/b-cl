import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AttendanceClient } from "@/components/attendance/attendance-client";
import { getStaff } from "@/lib/data/profiles";
import { redirect } from "next/navigation";

export const metadata = { title: "Attendance" };

export default async function AttendancePage() {
  const currentProfile = await requireProfile();
  
  if (currentProfile.role !== "owner") {
    redirect("/profile");
  }
  const staffList = await getStaff();
  const supabase = createClient();

  // Load all punches
  // RLS policies automatically restrict this, but we filter programmatically
  // for performance and to keep data responses clean.
  let query = supabase.from("attendance_punches").select("*");

  if (currentProfile.role !== "owner") {
    query = query.eq("profile_id", currentProfile.id);
  }

  const { data: punches } = await query
    .order("date", { ascending: false })
    .order("time", { ascending: true });

  return (
    <div className="container mx-auto">
      <AttendanceClient
        staffList={staffList}
        currentProfile={currentProfile}
        initialPunches={punches ?? []}
      />
    </div>
  );
}
