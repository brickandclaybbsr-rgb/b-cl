import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AttendanceClient } from "@/components/attendance/attendance-client";
import { AttendanceHRClient } from "@/components/attendance/attendance-hr-client";
import { getStaff } from "@/lib/data/profiles";
import { redirect } from "next/navigation";

export const metadata = { title: "Peoples" };

export default async function AttendancePage() {
  const currentProfile = await requireProfile();
  
  if (currentProfile.role !== "owner") {
    redirect("/profile");
  }
  const staffList = await getStaff();
  const supabase = createClient();

  // Load all punches
  let query = supabase.from("attendance_punches").select("*");

  if (currentProfile.role !== "owner") {
    query = query.eq("profile_id", currentProfile.id);
  }

  const { data: punches } = await query
    .order("date", { ascending: false })
    .order("time", { ascending: true });

  // Load all leaves and staff documents for owner view (wrapped in try-catch)
  let leaves: any[] = [];
  let documents: any[] = [];
  let advances: any[] = [];

  try {
    const { data: leavesData, error: leavesErr } = await supabase
      .from("leaves")
      .select("*")
      .order("submitted_at", { ascending: false });
    if (!leavesErr && leavesData) {
      leaves = leavesData;
    }
  } catch (err) {
    console.warn("Failed to fetch leaves for owner (table may not exist yet):", err);
  }

  try {
    const { data: docsData, error: docsErr } = await supabase
      .from("staff_documents")
      .select("*")
      .order("uploaded_at", { ascending: false });
    if (!docsErr && docsData) {
      documents = docsData;
    }
  } catch (err) {
    console.warn("Failed to fetch staff documents for owner (table may not exist yet):", err);
  }

  try {
    const { data: advData, error: advErr } = await supabase
      .from("payroll_advances")
      .select("*")
      .order("advance_date", { ascending: false });
    if (!advErr && advData) {
      advances = advData;
    }
  } catch (err) {
    console.warn("Failed to fetch payroll advances (table may not exist yet):", err);
  }

  return (
    <div className="container mx-auto">
      <AttendanceHRClient
        staffList={staffList}
        initialLeaves={leaves}
        initialDocuments={documents}
        initialAdvances={advances}
        ownerProfile={currentProfile}
        attendanceChild={
          <AttendanceClient
            staffList={staffList}
            currentProfile={currentProfile}
            initialPunches={punches ?? []}
          />
        }
      />
    </div>
  );
}

