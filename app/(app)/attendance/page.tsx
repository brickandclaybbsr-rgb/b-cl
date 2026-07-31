import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AttendanceClient } from "@/components/attendance/attendance-client";
import { AttendanceHRClient } from "@/components/attendance/attendance-hr-client";
import { getStaff } from "@/lib/data/profiles";
import { getTodayAttendance } from "@/lib/data/attendance";
import { TodayAttendancePanel } from "@/components/attendance/today-attendance";
import { redirect } from "next/navigation";

export const metadata = { title: "Peoples" };

export default async function AttendancePage() {
  const currentProfile = await requireProfile();
  
  if (currentProfile.role !== "owner") {
    redirect("/profile");
  }
  const staffList = await getStaff();
  const todayAttendance = await getTodayAttendance();
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

  let houseHelperPayments: any[] = [];
  try {
    const { data: hhData, error: hhErr } = await supabase
      .from("house_helper_payments")
      .select("*")
      .order("date", { ascending: false });
    if (!hhErr && hhData) {
      houseHelperPayments = hhData;
    }
  } catch (err) {
    console.warn("Failed to fetch house helper payments (table may not exist yet):", err);
  }

  let payrollOverrides: any[] = [];
  try {
    const { data: povData, error: povErr } = await supabase
      .from("payroll_overrides")
      .select("*");
    if (!povErr && povData) {
      payrollOverrides = povData;
    }
  } catch (err) {
    console.warn("Failed to fetch payroll overrides (table may not exist yet):", err);
  }

  let outlets: { id: string; name: string }[] = [];
  try {
    const { data: outletsData, error: outletsErr } = await supabase
      .from("outlets")
      .select("id, name")
      .order("name", { ascending: true });
    if (!outletsErr && outletsData) {
      outlets = outletsData;
    }
  } catch (err) {
    console.warn("Failed to fetch outlets (table may not exist yet):", err);
  }

  return (
    <div className="container mx-auto">
      <AttendanceHRClient
        staffList={staffList}
        initialLeaves={leaves}
        initialDocuments={documents}
        initialAdvances={advances}
        initialHouseHelperPayments={houseHelperPayments}
        initialPayrollOverrides={payrollOverrides}
        outlets={outlets}
        ownerProfile={currentProfile}
        todayAttendance={<TodayAttendancePanel data={todayAttendance} />}
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

