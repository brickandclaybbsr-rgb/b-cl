"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/auth";

export type AttendanceActionState = { ok?: boolean; error?: string; message?: string };

export interface PunchInsert {
  profile_id: string;
  pin: string;
  name: string;
  date: string;
  time: string;
  status?: string;
  dept_name?: string;
  uploaded_by: string;
}

/** Save a batch of biometric punches. Bypasses duplicate punches using unique constraint. */
export async function saveAttendancePunches(
  punches: PunchInsert[]
): Promise<AttendanceActionState> {
  const profile = await requireOwner();
  const supabase = createClient();

  if (punches.length === 0) {
    return { error: "No punches to save." };
  }

  // Add uploaded_by column to each record
  const payload = punches.map(p => ({
    ...p,
    uploaded_by: profile.id,
    uploaded_at: new Date().toISOString()
  }));

  const { error } = await supabase
    .from("attendance_punches")
    .upsert(payload, { onConflict: "profile_id,date,time" });

  if (error) {
    console.error("saveAttendancePunches error:", error);
    return { error: error.message };
  }

  revalidatePath("/attendance");
  revalidatePath("/owner");
  return { ok: true, message: `Successfully saved ${punches.length} attendance punch records.` };
}

/** Clear all punches for a staff member in a specific month (YYYY-MM) */
export async function clearAttendanceForMonth(
  profileId: string,
  month: string
): Promise<AttendanceActionState> {
  await requireOwner();
  const supabase = createClient();

  const [yearStr, monthStr] = month.split("-");
  const year = parseInt(yearStr);
  const m = parseInt(monthStr);

  const startDate = `${month}-01`;
  const lastDay = new Date(year, m, 0).getDate();
  const endDate = `${month}-${lastDay}`;

  const { error } = await supabase
    .from("attendance_punches")
    .delete()
    .eq("profile_id", profileId)
    .gte("date", startDate)
    .lte("date", endDate);

  if (error) {
    console.error("clearAttendanceForMonth error:", error);
    return { error: error.message };
  }

  revalidatePath("/attendance");
  revalidatePath("/owner");
  return { ok: true, message: "Attendance cleared for the selected month." };
}
