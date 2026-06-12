import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AttendanceClient } from "@/components/attendance/attendance-client";
import { AttendanceHRClient } from "@/components/attendance/attendance-hr-client";
import { getStaff } from "@/lib/data/profiles";
import { getProfileNameMap } from "@/lib/data/profiles";
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
  let reimbursements: any[] = [];

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

  // Load reimbursements for the Reimburse tab inside Peoples
  try {
    const { data: claimsData, error: claimsErr } = await supabase
      .from("reimbursements")
      .select("*")
      .order("submitted_at", { ascending: false });
    if (!claimsErr && claimsData) {
      const nameMap = await getProfileNameMap();
      reimbursements = claimsData.map((c) => ({
        ...c,
        submitted_by_name: nameMap[c.submitted_by] ?? "Staff member",
        processed_by_name: c.processed_by ? nameMap[c.processed_by] ?? "Owner" : undefined,
      }));
    }
  } catch (err) {
    console.warn("Failed to fetch reimbursements (table may not exist yet):", err);
  }

  return (
    <div className="container mx-auto">
      <AttendanceHRClient
        staffList={staffList}
        initialLeaves={leaves}
        initialDocuments={documents}
        initialReimbursements={reimbursements}
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
