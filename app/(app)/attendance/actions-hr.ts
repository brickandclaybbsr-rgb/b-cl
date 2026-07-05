"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, requireOwner } from "@/lib/auth";
import { todayIST } from "@/lib/date";
import { uploadPublicFile, deletePublicFile } from "@/lib/storage";
import { whatsappNotify } from "@/lib/whatsapp-notify";
import { notifyOwner, notifyStaff } from "@/lib/push";

export type HRActionState = { ok?: boolean; error?: string; message?: string };

// ── LEAVE MANAGEMENT ACTIONS ──────────────────────────────────────────────────

/** Apply for a leave */
export async function applyLeave(
  _prev: HRActionState,
  formData: FormData
): Promise<HRActionState> {
  try {
    const profile = await requireProfile();
    const supabase = createClient();

    const leaveType = String(formData.get("leaveType") ?? "").trim() as "cl" | "sl" | "lwp";
    const startDateStr = String(formData.get("startDate") ?? "").trim();
    const endDateStr = String(formData.get("endDate") ?? "").trim();
    const reason = String(formData.get("reason") ?? "").trim();

    if (!leaveType || (leaveType !== "cl" && leaveType !== "sl" && leaveType !== "lwp")) {
      return { error: "Please select a valid leave type." };
    }
    if (!startDateStr || !endDateStr) {
      return { error: "Please select both start and end dates." };
    }
    if (!reason) {
      return { error: "Please state the reason for your leave request." };
    }

    const start = new Date(startDateStr + "T00:00:00");
    const end = new Date(endDateStr + "T00:00:00");

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { error: "Invalid start or end date format." };
    }

    if (start > end) {
      return { error: "Start date cannot be after the end date." };
    }

    // POLICY 1: Casual Leave (CL) must be submitted at least 2 days in advance (except when acknowledged)
    if (leaveType === "cl") {
      const todayStr = todayIST(); // "yyyy-MM-dd"
      const todayDate = new Date(todayStr + "T00:00:00");
      const minAdvanceDate = new Date(todayDate);
      minAdvanceDate.setDate(todayDate.getDate() + 2); // Today + 2 days

      if (start < minAdvanceDate) {
        const acknowledged = formData.get("acknowledgeNotice") === "on";
        if (!acknowledged) {
          return {
            error: "Casual Leave (CL) must be submitted at least 2 days in advance. Please acknowledge the warning to submit.",
          };
        }
      }
    }

    // POLICY 2: No Casual Leaves are permitted on Fridays, Saturdays, or Sundays (except when submitted for approval)
    // Hard block is removed as they should be sent for approval with warning shown in UI.

    const { error } = await supabase.from("leaves").insert({
      profile_id: profile.id,
      leave_type: leaveType,
      start_date: startDateStr,
      end_date: endDateStr,
      reason,
      status: "pending",
    });

    if (error) {
      console.error("applyLeave database error:", error);
      if (error.code === "P0001" || error.message.includes("relation")) {
        return {
          error: "Database table 'leaves' not found. Please apply the migration in your Supabase SQL editor first.",
        };
      }
      return { error: error.message };
    }

    await whatsappNotify.leaveRequest(profile.name, leaveType, startDateStr, endDateStr);
    await notifyOwner.leaveRequest(profile.name, leaveType);

    revalidatePath("/profile");
    revalidatePath("/attendance");
    return { ok: true, message: "Leave request submitted successfully." };
  } catch (err: any) {
    console.error("applyLeave exception:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}

/** Approve/Reject a leave request (Owner only) */
export async function updateLeaveStatus(
  leaveId: string,
  status: "approved" | "rejected",
  notes?: string
): Promise<HRActionState> {
  try {
    const owner = await requireOwner();
    const supabase = createClient();

    const { data: leaveData } = await supabase
      .from("leaves")
      .select("profile_id, leave_type")
      .eq("id", leaveId)
      .maybeSingle();

    const { error } = await supabase
      .from("leaves")
      .update({
        status,
        notes: notes || null,
        processed_by: owner.id,
        processed_at: new Date().toISOString(),
      })
      .eq("id", leaveId);

    if (error) {
      console.error("updateLeaveStatus database error:", error);
      return { error: error.message };
    }

    if (leaveData?.profile_id && leaveData?.leave_type) {
      if (status === "approved") {
        await notifyStaff.leaveApproved(leaveData.profile_id, leaveData.leave_type);
      } else {
        await notifyStaff.leaveRejected(leaveData.profile_id, leaveData.leave_type);
      }
    }

    revalidatePath("/profile");
    revalidatePath("/attendance");
    return { ok: true, message: `Leave request status updated to ${status}.` };
  } catch (err: any) {
    console.error("updateLeaveStatus exception:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}

/** Cancel a pending leave request (Staff only) */
export async function deleteLeave(leaveId: string): Promise<HRActionState> {
  try {
    const profile = await requireProfile();
    const supabase = createClient();

    // RLS policy prevents deleting non-owned/non-pending leaves, 
    // but we add a check here as well for clean UI feedback.
    const { data: leave, error: fetchErr } = await supabase
      .from("leaves")
      .select("profile_id, status")
      .eq("id", leaveId)
      .single();

    if (fetchErr || !leave) {
      return { error: "Leave request not found." };
    }

    if (leave.profile_id !== profile.id) {
      return { error: "You are not authorized to cancel this leave request." };
    }

    if (leave.status !== "pending") {
      return { error: "Only pending leave requests can be cancelled." };
    }

    const { error } = await supabase.from("leaves").delete().eq("id", leaveId);

    if (error) {
      console.error("deleteLeave database error:", error);
      return { error: error.message };
    }

    revalidatePath("/profile");
    revalidatePath("/attendance");
    return { ok: true, message: "Leave request cancelled successfully." };
  } catch (err: any) {
    console.error("deleteLeave exception:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}

// ── STAFF DOCUMENTS ACTIONS ───────────────────────────────────────────────────

/** Upload a staff document (Owner only) */
export async function uploadStaffDocument(
  _prev: HRActionState,
  formData: FormData
): Promise<HRActionState> {
  try {
    const owner = await requireOwner();
    const supabase = createClient();

    const profileId = String(formData.get("profileId") ?? "").trim();
    const type = String(formData.get("type") ?? "").trim();
    const month = String(formData.get("month") ?? "").trim();
    const file = formData.get("file") as File;

    if (!profileId) return { error: "Please select a staff member." };
    if (!type || (type !== "appointment_letter" && type !== "salary_slip" && type !== "aadhar_card" && type !== "pan_card")) {
      return { error: "Please select a valid document type." };
    }
    if (type === "salary_slip" && !month) {
      return { error: "Please select a month for the salary slip." };
    }
    if (!file || file.size === 0) {
      return { error: "Please select a document file to upload." };
    }

    // Upload to Supabase Storage (works on serverless/Vercel)
    let fileUrl = "";
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filename = `${Date.now()}-${type}-${cleanName}`;
      fileUrl = await uploadPublicFile(
        "staff-docs",
        filename,
        buffer,
        file.type || "application/octet-stream",
      );
    } catch (uploadErr: any) {
      console.error("Document file upload failed:", uploadErr);
      return { error: "File upload failed: " + uploadErr.message };
    }

    const { error } = await supabase.from("staff_documents").insert({
      profile_id: profileId,
      type,
      month: type === "salary_slip" ? month : null,
      file_url: fileUrl,
      file_name: file.name,
      uploaded_by: owner.id,
    });

    if (error) {
      console.error("uploadStaffDocument database error:", error);
      // Clean up the uploaded file if DB insert fails
      await deletePublicFile(fileUrl);

      if (error.code === "P0001" || error.message.includes("relation")) {
        return {
          error: "Database table 'staff_documents' not found. Please apply the migration in your Supabase SQL editor first.",
        };
      }
      return { error: error.message };
    }

    revalidatePath("/profile");
    revalidatePath("/attendance");
    return { ok: true, message: "Staff document uploaded successfully." };
  } catch (err: any) {
    console.error("uploadStaffDocument exception:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}

/** Delete a staff document (Owner only) */
export async function deleteStaffDocument(documentId: string): Promise<HRActionState> {
  try {
    await requireOwner();
    const supabase = createClient();

    // Fetch the document first to get the URL for file deletion
    const { data: doc, error: fetchErr } = await supabase
      .from("staff_documents")
      .select("file_url")
      .eq("id", documentId)
      .single();

    if (fetchErr || !doc) {
      return { error: "Staff document not found." };
    }

    // Delete record from database
    const { error: deleteErr } = await supabase
      .from("staff_documents")
      .delete()
      .eq("id", documentId);

    if (deleteErr) {
      console.error("deleteStaffDocument DB error:", deleteErr);
      return { error: deleteErr.message };
    }

    // Remove the file from storage (best-effort)
    await deletePublicFile(doc.file_url);

    revalidatePath("/profile");
    revalidatePath("/attendance");
    return { ok: true, message: "Document deleted successfully." };
  } catch (err: any) {
    console.error("deleteStaffDocument exception:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}

// ── PAYROLL ADVANCES ACTIONS ──────────────────────────────────────────────────

/** Save a payroll advance entry (Owner only) */
export async function savePayrollAdvance(
  _prev: HRActionState,
  formData: FormData
): Promise<HRActionState> {
  try {
    const owner = await requireOwner();
    const supabase = createClient();

    const profileId = String(formData.get("profileId") ?? "").trim();
    const month = String(formData.get("month") ?? "").trim();
    const amount = parseFloat(String(formData.get("amount") ?? "0").trim());
    const notes = String(formData.get("notes") ?? "").trim() || null;
    const advanceDate = String(formData.get("advanceDate") ?? "").trim() || null;

    if (!profileId) return { error: "Please select a staff member." };
    if (!month) return { error: "Please select a month." };
    if (!amount || amount <= 0) return { error: "Please enter a valid advance amount." };

    const { error } = await supabase.from("payroll_advances").insert({
      profile_id: profileId,
      month,
      amount,
      notes,
      advance_date: advanceDate || null,
      recorded_by: owner.id,
    });

    if (error) {
      console.error("savePayrollAdvance DB error:", error);
      if (error.code === "42P01") {
        return { error: "The payroll_advances table does not exist yet. Please run the migration SQL in your Supabase dashboard." };
      }
      return { error: error.message };
    }

    revalidatePath("/attendance");
    return { ok: true, message: "Advance recorded successfully." };
  } catch (err: any) {
    console.error("savePayrollAdvance exception:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}

/** Delete a payroll advance entry (Owner only) */
export async function deletePayrollAdvance(advanceId: string): Promise<HRActionState> {
  try {
    await requireOwner();
    const supabase = createClient();

    const { error } = await supabase
      .from("payroll_advances")
      .delete()
      .eq("id", advanceId);

    if (error) {
      console.error("deletePayrollAdvance DB error:", error);
      return { error: error.message };
    }

    revalidatePath("/attendance");
    return { ok: true, message: "Advance deleted." };
  } catch (err: any) {
    console.error("deletePayrollAdvance exception:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}

/** Toggle staff payslip visibility (Owner only) */
export async function togglePayslipVisibility(
  docId: string,
  isVisible: boolean
): Promise<HRActionState> {
  try {
    await requireOwner();
    const supabase = createClient();

    const { error } = await supabase
      .from("staff_documents")
      .update({ is_visible_to_staff: isVisible })
      .eq("id", docId);

    if (error) {
      console.error("togglePayslipVisibility DB error:", error);
      return { error: error.message };
    }

    revalidatePath("/profile");
    revalidatePath("/attendance");
    return { ok: true };
  } catch (err: any) {
    console.error("togglePayslipVisibility exception:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}



/** Generate a salary slip document and save to profiles and staff_documents */
export async function generatePayslip(
  _prev: HRActionState,
  formData: FormData
): Promise<HRActionState> {
  try {
    const owner = await requireOwner();
    const supabase = createClient();

    const profileId = String(formData.get("profileId") ?? "").trim();
    const employee = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .single();

    if (employee.error || !employee.data) {
      return { error: "Selected staff member not found." };
    }

    const res = await generatePayslipInternal(supabase, owner, employee.data, formData);
    if (res.error) return { error: res.error };

    revalidatePath("/profile");
    revalidatePath("/attendance");
    return { ok: true, message: res.message };
  } catch (err: any) {
    console.error("generatePayslip exception:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}

/** Batch Generate Payslips for all active users except Biswajeet Kandi */
export async function generateBatchPayslips(
  _prev: HRActionState,
  formData: FormData
): Promise<HRActionState> {
  try {
    const owner = await requireOwner();
    const supabase = createClient();

    const month = String(formData.get("month") ?? "").trim();
    const paidThrough = String(formData.get("paidThrough") ?? "").trim();

    if (!month || !paidThrough) {
      return { error: "Please fill in all required fields." };
    }

    // Fetch all active profiles (except Biswajeet Kandi and owner)
    const { data: staffList, error: staffErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("is_active", true)
      .neq("role", "owner");

    if (staffErr || !staffList) {
      return { error: "Failed to fetch active staff list." };
    }

    const filteredStaff = staffList;

    if (filteredStaff.length === 0) {
      return { error: "No active staff members found to process." };
    }

    // Validate that all profiles have complete payroll details
    const incompleteStaff = filteredStaff.filter(
      (s) => !s.employee_code || !s.basic_pay || !s.aadhar_number || !s.pan_number
    );

    if (incompleteStaff.length > 0) {
      const names = incompleteStaff.map((s) => s.name).join(", ");
      return {
        error: `Cannot batch generate: The following staff members are missing payroll details (Employee Code, Basic Salary, Aadhar, or PAN): ${names}. Please update their profiles in the People tab first.`
      };
    }

    let successCount = 0;
    // Generate payslip for each profile
    for (const employee of filteredStaff) {
      const subFormData = new FormData();
      subFormData.append("profileId", employee.id);
      subFormData.append("month", month);
      subFormData.append("employeeCode", employee.employee_code!);
      subFormData.append("dob", employee.dob || "");
      subFormData.append("aadhar", employee.aadhar_number!);
      subFormData.append("pan", employee.pan_number!);
      subFormData.append("basicPay", String(employee.basic_pay!));
      subFormData.append("amountPaid", String(employee.basic_pay!));
      subFormData.append("paidThrough", paidThrough);

      const res = await generatePayslipInternal(supabase, owner, employee, subFormData);
      if (res.ok) {
        successCount++;
      } else {
        console.error(`Failed to generate payslip for ${employee.name}:`, res.error);
      }
    }

    revalidatePath("/profile");
    revalidatePath("/attendance");

    // Format Month Label
    const [yearStr, monthStr] = month.split("-");
    const date = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
    const monthLabel = date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

    return {
      ok: true,
      message: `Successfully generated ${successCount} salary slips for ${monthLabel}!`
    };
  } catch (err: any) {
    console.error("generateBatchPayslips exception:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}

/** Private helper function to handle payslip generation logic for a single staff member */
async function generatePayslipInternal(
  supabase: any,
  owner: any,
  employee: any,
  formData: FormData
): Promise<HRActionState> {
  const profileId = String(formData.get("profileId") ?? "").trim();
  const month = String(formData.get("month") ?? "").trim();
  const employeeCode = String(formData.get("employeeCode") ?? "").trim();
  const dob = String(formData.get("dob") ?? "").trim();
  const aadhar = String(formData.get("aadhar") ?? "").trim();
  const pan = String(formData.get("pan") ?? "").trim();
  const basicPay = String(formData.get("basicPay") ?? "").trim();
  const amountPaid = String(formData.get("amountPaid") ?? "").trim();
  const paidThrough = String(formData.get("paidThrough") ?? "").trim();

  if (!profileId || !month || !employeeCode || !aadhar || !pan || !basicPay || !paidThrough) {
    return { error: "Please fill in all required fields." };
  }

  // Resolve reporting authority name
  let reportingAuthorityName = "Not Assigned";
  if (employee.reporting_authority) {
    const { data: repAuth } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", employee.reporting_authority)
      .single();
    if (repAuth) {
      reportingAuthorityName = repAuth.name;
    }
  }

  // Update staff profile with these details so they persist for next month
  const { error: profileUpdateErr } = await supabase
    .from("profiles")
    .update({
      employee_code: employeeCode,
      dob: dob || null,
      aadhar_number: aadhar,
      pan_number: pan,
      basic_pay: parseFloat(basicPay),
      paid_through: paidThrough,
    })
    .eq("id", profileId);

  if (profileUpdateErr) {
    console.warn("Failed to update staff profile fields:", profileUpdateErr);
  }

  // Format Month Label (e.g. "June 2026")
  const [yearStr, monthStr] = month.split("-");
  const year = parseInt(yearStr);
  const monthNum = parseInt(monthStr);
  const date = new Date(year, monthNum - 1, 1);
  const monthLabel = date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const maxDay = new Date(year, monthNum, 0).getDate();
  const startOfMonth = new Date(year, monthNum - 1, 1);
  const startOfMonthStr = `${year}-${String(monthNum).padStart(2, "0")}-01`;
  const endOfMonthStr = `${year}-${String(monthNum).padStart(2, "0")}-${maxDay}`;

  // 1. Fetch approved leaves overlapping with the month
  const { data: leaves } = await supabase
    .from("leaves")
    .select("*")
    .eq("profile_id", profileId)
    .eq("status", "approved")
    .lte("start_date", endOfMonthStr)
    .gte("end_date", startOfMonthStr);

  // 2. Fetch punches for this month
  const { data: punches } = await supabase
    .from("attendance_punches")
    .select("date")
    .eq("profile_id", profileId)
    .gte("date", startOfMonthStr)
    .lte("date", endOfMonthStr);

  const punchDates = new Set((punches ?? []).map((p: any) => p.date));

  // 2b. Fetch advance deductions for this staff member and month
  let totalAdvance = 0;
  let advanceRows: Array<{ amount: number; notes: string | null; advance_date: string | null }> = [];
  try {
    const { data: advances } = await supabase
      .from("payroll_advances")
      .select("amount, notes, advance_date")
      .eq("profile_id", profileId)
      .eq("month", month);
    if (advances && advances.length > 0) {
      advanceRows = advances;
      totalAdvance = advances.reduce((sum: number, a: any) => sum + Number(a.amount), 0);
    }
  } catch {
    // Table may not exist yet — silently skip
  }

  // 2c. Fetch next month advances (shown as "upcoming deductions" in the slip)
  const nextMonthNum = monthNum === 12 ? 1 : monthNum + 1;
  const nextYear = monthNum === 12 ? year + 1 : year;
  const nextMonthStr = `${nextYear}-${String(nextMonthNum).padStart(2, "0")}`;
  let nextMonthAdvances: Array<{ amount: number; notes: string | null; advance_date: string | null }> = [];
  let totalNextMonthAdvance = 0;
  try {
    const { data: nextAdvs } = await supabase
      .from("payroll_advances")
      .select("amount, notes, advance_date")
      .eq("profile_id", profileId)
      .eq("month", nextMonthStr);
    if (nextAdvs && nextAdvs.length > 0) {
      nextMonthAdvances = nextAdvs;
      totalNextMonthAdvance = nextAdvs.reduce((sum: number, a: any) => sum + Number(a.amount), 0);
    }
  } catch {
    // silently skip
  }

  // 3. Build Daily Calendar & Count Stats
  const isBiswajeetJune2026 = 
    (employee.name.toLowerCase().includes("biswajeet") || employee.name.toLowerCase().includes("kandi")) && 
    month === "2026-06";

  let presentCount = 0;
  let clCount = 0;
  let slCount = 0;
  let lwpCount = 0;

  interface DayDetail {
    dayNum: number;
    class: string;
    statusLabel: string;
  }

  const calendarDays: DayDetail[] = [];

  for (let day = 1; day <= maxDay; day++) {
    const dateStr = `${year}-${String(monthNum).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    
    // Check if covered by any leave
    const leave = (leaves ?? []).find(
      (l: any) => l.start_date <= dateStr && l.end_date >= dateStr
    );

    if (leave) {
      const type = leave.leave_type; // 'cl', 'sl', 'lwp'
      if (type === "cl") clCount++;
      else if (type === "sl") slCount++;
      else if (type === "lwp") lwpCount++;

      calendarDays.push({
        dayNum: day,
        class: type === "cl" ? "cl-day" : type === "sl" ? "sl-day" : "lwp-day",
        statusLabel: type.toUpperCase()
      });
    } else {
      // Check punches
      if (punchDates.has(dateStr) || isBiswajeetJune2026) {
        presentCount++;
        calendarDays.push({
          dayNum: day,
          class: "present",
          statusLabel: ""
        });
      } else {
        // Absent without leave counts as LWP
        lwpCount++;
        calendarDays.push({
          dayNum: day,
          class: "lwp-day",
          statusLabel: "LWP"
        });
      }
    }
  }

  // 4. Calculate LWP deduction, advance deduction, and net salary
  const dailyRate = parseFloat(basicPay) / maxDay;
  const extraDutyPayment = isBiswajeetJune2026 ? 13 * dailyRate : 0;
  const lwpDeduction = lwpCount * dailyRate;
  const grossBeforeAdvance = Math.max(0, parseFloat(basicPay) + extraDutyPayment - lwpDeduction);
  const netSalary = Math.max(0, grossBeforeAdvance - totalAdvance);
  const amountPaidNum = amountPaid ? Math.max(0, parseFloat(amountPaid) - totalAdvance) : netSalary;
  const cfCount = isBiswajeetJune2026 ? 2 : Math.max(0, 4 - clCount);

  // Build calendar grid HTML table rows
  const startDayOfWeek = startOfMonth.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const mondayFirstDay = (startDayOfWeek + 6) % 7; // 0 = Mon, ..., 6 = Sun

  let calendarHTML = '<thead><tr><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th><th>Sun</th></tr></thead><tbody><tr>';
  
  // Add empty padding cells before day 1
  for (let i = 0; i < mondayFirstDay; i++) {
    calendarHTML += '<td class="empty"></td>';
  }

  let colCount = mondayFirstDay;

  calendarDays.forEach((day) => {
    if (colCount === 7) {
      calendarHTML += '</tr><tr>';
      colCount = 0;
    }
    
    const statusSpan = day.statusLabel 
      ? `<span class="day-status" style="background:${
          day.class === 'cl-day' ? '#bfdbfe;color:#1e40af;' : 
          day.class === 'sl-day' ? '#ddd6fe;color:#5b21b6;' : 
          '#fecaca;color:#7f1d1d;'
        }">${day.statusLabel}</span>` 
      : `<span class="day-status" style="background:#dcfce7;color:#15803d;">P</span>`;
      
    calendarHTML += `<td class="${day.class}"><div class="day-num">${day.dayNum}</div>${statusSpan}</td>`;
    colCount++;
  });

  // Add empty padding cells at the end of the month
  if (colCount < 7) {
    for (let i = colCount; i < 7; i++) {
      calendarHTML += '<td class="empty"></td>';
    }
  }
  calendarHTML += '</tr></tbody>';

  // Load corporate logo as base64 directly from local Assets folder
  let logoBase64 = "";
  try {
    const fs = require('fs');
    const path = require('path');
    const logoPath = path.join(process.cwd(), 'Assets', 'Brick & Clay White Full Logo.png');
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
    }
  } catch (logoErr) {
    console.warn("Logo load failed:", logoErr);
  }

  // Fetch Soumyashree Das signature and stamp directly from local filesystem
  let signatureBase64 = "";
  let stampBase64 = "";
  let signatoryName = "Soumyashree Das";
  let signatoryTitle = "Managing Director";

  try {
    const fs = require('fs');
    const localSigPath = "D:\\Brick & Clay\\Documents\\Signature Soumyashree Das.png";
    if (fs.existsSync(localSigPath)) {
      const sigBuffer = fs.readFileSync(localSigPath);
      signatureBase64 = `data:image/png;base64,${sigBuffer.toString("base64")}`;
    }
  } catch (err) {
    console.warn("Local signature load failed:", err);
  }

  try {
    const fs = require('fs');
    const localStampPath = "D:\\Brick & Clay\\Documents\\brick and Clay S Stamp.png";
    if (fs.existsSync(localStampPath)) {
      const stampBuffer = fs.readFileSync(localStampPath);
      stampBase64 = `data:image/png;base64,${stampBuffer.toString("base64")}`;
    }
  } catch (err) {
    console.warn("Local stamp load failed:", err);
  }

  // Fallback signature resolution if local file is missing
  if (!signatureBase64) {
    const { data: hrManagerProfile } = await supabase
      .from("profiles")
      .select("signature_url, name")
      .eq("name", "Soumyashree Das")
      .maybeSingle();

    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("signature_url, name")
      .eq("id", owner.id)
      .single();

    const signatoryProfile = hrManagerProfile?.signature_url ? hrManagerProfile : ownerProfile;
    if (signatoryProfile?.signature_url?.startsWith("http")) {
      try {
        const res = await fetch(signatoryProfile.signature_url);
        if (res.ok) {
          const sigBuffer = Buffer.from(await res.arrayBuffer());
          signatureBase64 = `data:image/png;base64,${sigBuffer.toString("base64")}`;
        }
      } catch (sigErr) {
        console.warn("Signature fetch failed:", sigErr);
      }
    }
    signatoryName = signatoryProfile?.name || "Soumyashree Das";
    signatoryTitle = signatoryProfile?.name === "Soumyashree Das" ? "Managing Director" : "Authorized Signatory";
  }

  // Helper to safely format dates from YYYY-MM-DD to DD/MM/YYYY
  const formatDateStr = (d: string | null | undefined) => {
    if (!d) return "Not Provided";
    const parts = d.split("-");
    if (parts.length !== 3) return d;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const formatCurr = (val: number) => val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Generate Beautiful HTML Content (2-page print layout)
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Payslip - ${employee.name} - ${monthLabel}</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Poppins','Segoe UI',sans-serif;color:#1a1a1a;background:#ffffff;font-size:13px;}
    .header{background:#111111;padding:22px 40px;display:flex;align-items:center;gap:18px;border-bottom:4px solid #eab308;}
    .logo{height:38px;}
    .co-info{color:#ffffff;}
    .co-name{font-size:16px;font-weight:700;letter-spacing:.5px;}
    .co-sub{font-size:10px;opacity:.75;margin-top:2px;}
    .doc{padding:30px 40px;max-width:900px;margin:0 auto;background:#ffffff;}
    .doc-title{text-align:center;margin-bottom:24px;}
    .doc-title h2{font-size:15px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:#111111;border-bottom:3px solid #eab308;padding-bottom:8px;display:inline-block;}
    .doc-title p{font-size:11px;color:#6b7280;margin-top:5px;font-weight:500;}
    .slbl{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#111111;border-bottom:2px solid #111111;padding-bottom:5px;margin-bottom:12px;margin-top:20px;}
    table.info{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:4px;}
    table.info td{padding:8px 12px;border:1px solid #e5e7eb;}
    table.info td.lbl{background:#f9fafb;font-weight:600;color:#4b5563;width:22%;}
    table.info td.val{color:#111111;font-weight:500;}
    table.pay{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:8px;}
    table.pay th{background:#111111;padding:10px 14px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#ffffff;border:1px solid #111111;}
    table.pay td{padding:11px 14px;border:1px solid #e5e7eb;}
    table.pay .earn{color:#16a34a;font-weight:600;}
    table.pay .deduct{color:#dc2626;font-weight:600;}
    table.pay .net-row td{background:#fef9c3;font-weight:700;border-top:2px solid #eab308;border-bottom:2px solid #eab308;}
    table.pay .net-lbl{font-size:14px;color:#854d0e;}
    table.pay .net-amt{font-size:16px;color:#111111;font-weight:800;}
    .note{font-size:10px;color:#6b7280;font-style:italic;margin-top:8px;margin-bottom:16px;}
    .tax-note{font-size:11px;background:#fefcbf;border-left:3px solid #eab308;padding:10px 14px;color:#718096;margin-bottom:20px;border-radius:0 4px 4px 0;}
    .sig-row{display:flex;justify-content:space-between;margin-top:36px;padding-top:16px;border-top:1px solid #e5e7eb;}
    .sig-block{text-align:center;width:42%;}
    .sig-space{height:48px;}
    .sig-line{border-top:1.5px dashed #111111;margin-bottom:6px;}
    .sig-name{font-size:12px;font-weight:700;color:#111111;}
    .sig-title{font-size:9px;color:#6b7280;margin-top:2px;text-transform:uppercase;letter-spacing:.5px;}
    .footer-note{font-size:9px;color:#9ca3af;text-align:center;margin-top:16px;}
    .page-break{page-break-before:always;}
    .att-cards{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:24px;}
    .att-card{text-align:left;padding:14px 16px;border-radius:8px;background:#ffffff;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,0.05);display:flex;flex-direction:column;justify-content:space-between;height:72px;}
    .att-card .num{font-size:26px;font-weight:800;line-height:1;margin-bottom:4px;}
    .att-card .lbl{font-size:9px;text-transform:uppercase;letter-spacing:.7px;color:#6b7280;font-weight:600;}
    .att-card.present{border-left:4px solid #16a34a;} .att-card.present .num{color:#16a34a;}
    .att-card.cl{border-left:4px solid #1d4ed8;} .att-card.cl .num{color:#1d4ed8;}
    .att-card.sl{border-left:4px solid #6d28d9;} .att-card.sl .num{color:#6d28d9;}
    .att-card.lwp{border-left:4px solid #991b1b;} .att-card.lwp .num{color:#991b1b;}
    .att-card.cf{border-left:4px solid #92400e;} .att-card.cf .num{color:#92400e;}
    table.cal{width:100%;border-collapse:collapse;font-size:11px;background:#ffffff;}
    table.cal th{text-align:center;padding:10px 4px;background:#111111;border:1px solid #111111;font-size:9px;font-weight:700;text-transform:uppercase;color:#ffffff;letter-spacing:1px;}
    table.cal td{text-align:left;padding:8px 10px;border:1px solid #e5e7eb;vertical-align:top;height:58px;position:relative;background:#ffffff;}
    table.cal td .day-num{font-size:12px;font-weight:700;color:#374151;}
    table.cal td .day-status{position:absolute;bottom:8px;right:8px;font-size:9px;padding:2px 6px;border-radius:4px;font-weight:700;text-transform:uppercase;letter-spacing:.3px;line-height:1;}
    table.cal td.empty{background:#f9fafb;}
    table.cal td.present .day-num{color:#166534;}
    table.cal td.cl-day{background:#f8fafc;} table.cal td.cl-day .day-num{color:#1d4ed8;}
    table.cal td.sl-day{background:#fcfbfe;} table.cal td.sl-day .day-num{color:#6d28d9;}
    table.cal td.lwp-day{background:#fffafb;} table.cal td.lwp-day .day-num{color:#991b1b;}
    table.cal td.cf-day{background:#fffdf9;} table.cal td.cf-day .day-num{color:#92400e;}
    .legend{display:flex;gap:18px;margin-top:16px;flex-wrap:wrap;}
    .legend-item{display:flex;align-items:center;gap:6px;font-size:10px;color:#4b5563;font-weight:500;}
    .legend-dot{width:12px;height:12px;border-radius:3px;border:1px solid #e5e7eb;}
    @media print{
      body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
      .page-break{page-break-before:always;}
    }
  </style>
</head>
<body>

<!-- PAGE 1 ─ SALARY SLIP -->
<div class="header">
  ${logoBase64 ? `<img src="${logoBase64}" class="logo" alt="Brick and Clay">` : `<strong style="font-size: 20px; color: #ffffff; letter-spacing: 0.5px;">BRICK & CLAY</strong>`}
  <div class="co-info">
    <div class="co-name">SS BRICK AND CLAY PRIVATE LIMITED</div>
    <div class="co-sub">C-3, Ground Floor, Inox Block, BMC Bhawani Mall, Saheed Nagar, Bhubaneswar, Odisha &ndash; 751007</div>
  </div>
</div>

<div class="doc">
  <div class="doc-title">
    <h2>Salary Slip</h2>
    <p>${monthLabel}</p>
  </div>

  <div class="slbl">Employee Information</div>
  <table class="info">
    <tr>
      <td class="lbl">Employee Name</td>
      <td class="val" colspan="3">${employee.name}</td>
    </tr>
    <tr>
      <td class="lbl">Employee Code</td>
      <td class="val">${employeeCode}</td>
      <td class="lbl">Designation</td>
      <td class="val">${employee.designation || "Not Provided"}</td>
    </tr>
    <tr>
      <td class="lbl">Date of Birth</td>
      <td class="val">${formatDateStr(dob)}</td>
      <td class="lbl">Date of Joining</td>
      <td class="val">${formatDateStr(employee.date_of_joining)}</td>
    </tr>
    <tr>
      <td class="lbl">Aadhar Number</td>
      <td class="val">${aadhar}</td>
      <td class="lbl">PAN Number</td>
      <td class="val">${pan}</td>
    </tr>
    <tr>
      <td class="lbl">Employment Type</td>
      <td class="val">${employee.employment_type || "Not Provided"}</td>
      <td class="lbl">Reporting Authority</td>
      <td class="val">${reportingAuthorityName}</td>
    </tr>
    <tr>
      <td class="lbl">Work Location</td>
      <td class="val">${employee.work_location || "Not Provided"}</td>
      <td class="lbl">Working Hours</td>
      <td class="val">${employee.working_hours || "Not Provided"}</td>
    </tr>
  </table>

  <div class="slbl">Earnings &amp; Deductions</div>
  <table class="pay">
    <thead>
      <tr>
        <th style="width:50%">Description</th>
        <th style="width:25%">Days / Basis</th>
        <th style="width:25%">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Basic Salary (Gross)</td>
        <td>${maxDay}-day month</td>
        <td class="earn">₹${formatCurr(parseFloat(basicPay))}</td>
      </tr>
      ${extraDutyPayment > 0 ? `
      <tr>
        <td>Extra Duty Allowance</td>
        <td>13 days &times; ₹${formatCurr(dailyRate)}/day</td>
        <td class="earn">+ ₹${formatCurr(extraDutyPayment)}</td>
      </tr>
      ` : ""}
      ${lwpCount > 0 ? `
      <tr>
        <td>Leave Without Pay (LWP)</td>
        <td>${lwpCount} days &times; ₹${formatCurr(dailyRate)}/day</td>
        <td class="deduct">&#8722; ₹${formatCurr(lwpDeduction)}</td>
      </tr>
      ` : `
      <tr>
        <td style="color:#9ca3af">Deductions (Tax / PF / LWP)</td>
        <td style="color:#9ca3af">&#8212;</td>
        <td style="color:#9ca3af">Nil</td>
      </tr>
      `}
      ${advanceRows.length > 0 ? advanceRows.map((adv: any) => `
      <tr>
        <td>Advance Deduction${adv.notes ? ` (${adv.notes})` : ""}</td>
        <td>${adv.advance_date ? new Date(adv.advance_date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Advance"}</td>
        <td class="deduct">&#8722; ₹${formatCurr(Number(adv.amount))}</td>
      </tr>`).join("") : ""}
      ${nextMonthAdvances.length > 0 ? `
      <tr style="background:#fffbeb;">
        <td colspan="3" style="padding:6px 14px;font-size:10px;font-weight:600;color:#92400e;letter-spacing:.3px;">
          &#9432; Upcoming Deductions — will be recovered in next month's salary
        </td>
      </tr>
      ${nextMonthAdvances.map((adv: any) => `
      <tr style="background:#fffbeb;opacity:.85;">
        <td style="color:#92400e;">Advance (${nextMonthStr}) ${adv.notes ? `— ${adv.notes}` : ""}</td>
        <td style="color:#92400e;">${adv.advance_date ? new Date(adv.advance_date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
        <td style="color:#92400e;font-style:italic;">&#8722; ₹${formatCurr(Number(adv.amount))} *</td>
      </tr>`).join("")}
      ` : ""}
    </tbody>
    <tfoot>
      <tr class="net-row">
        <td class="net-lbl">Net Salary (Hand Salary)</td>
        <td><strong>${presentCount} days present</strong></td>
        <td class="net-amt">₹${formatCurr(netSalary)}</td>
      </tr>
    </tfoot>
  </table>

  <div class="tax-note">
    <strong>Tax &amp; PF Policy Note:</strong> SS Brick and Clay Private Limited has processed this payslip with zero tax/PF deductions for the current period. In-hand salary matches gross salary minus LWP days.
  </div>

  <div class="note">
    * This is a system-generated salary slip and does not require a physical signature unless disputed.
    Payment Method: ${paidThrough} | Amount Disbursed: ₹${formatCurr(amountPaidNum)}
    ${nextMonthAdvances.length > 0 ? `<br>* Upcoming advance of ₹${formatCurr(totalNextMonthAdvance)} (${nextMonthStr}) is shown for transparency and will be recovered from the next month's salary.` : ""}
  </div>

  <div class="sig-row" style="align-items: flex-end;">
    <div class="sig-block">
      <div class="sig-space"></div>
      <div class="sig-line"></div>
      <div class="sig-name">${employee.name}</div>
      <div class="sig-title">Employee Signature</div>
    </div>
    <div style="width: 16%; display: flex; justify-content: center; align-items: center; padding-bottom: 20px;">
      ${stampBase64 ? `<img src="${stampBase64}" style="max-height: 70px; max-width: 70px; object-fit: contain; opacity: 0.95;" alt="Company Stamp" />` : ""}
    </div>
    <div class="sig-block">
      <div class="sig-space" style="display:flex; align-items:center; justify-content:center;">
        ${signatureBase64 ? `<img src="${signatureBase64}" style="max-height: 48px; max-width: 140px; object-fit: contain;" alt="Authorized Signature" />` : ""}
      </div>
      <div class="sig-line"></div>
      <div class="sig-name">${signatoryName}</div>
      <div class="sig-title">${signatoryTitle}</div>
    </div>
  </div>
  
  <div class="footer-note">
    SS Brick and Clay Private Limited &#183; ${monthLabel}
  </div>
</div>

<!-- PAGE 2 ─ ATTENDANCE REPORT -->
<div class="page-break"></div>

<div class="header">
  ${logoBase64 ? `<img src="${logoBase64}" class="logo" alt="Brick and Clay">` : `<strong style="font-size: 20px; color: #ffffff; letter-spacing: 0.5px;">BRICK & CLAY</strong>`}
  <div class="co-info">
    <div class="co-name">SS BRICK AND CLAY PRIVATE LIMITED</div>
    <div class="co-sub">C-3, Ground Floor, Inox Block, BMC Bhawani Mall, Saheed Nagar, Bhubaneswar, Odisha &ndash; 751007</div>
  </div>
</div>

<div class="doc">
  <div class="doc-title">
    <h2>Attendance Report</h2>
    <p>${employee.name} &nbsp;&#124;&nbsp; ${employeeCode} &nbsp;&#124;&nbsp; ${monthLabel}</p>
  </div>

  <div class="att-cards">
    <div class="att-card present"><div class="num">${presentCount}</div><div class="lbl">Days Present</div></div>
    <div class="att-card cl"><div class="num">${clCount}</div><div class="lbl">Casual Leave</div></div>
    <div class="att-card sl"><div class="num">${slCount}</div><div class="lbl">Sick Leave</div></div>
    <div class="att-card lwp"><div class="num">${lwpCount}</div><div class="lbl">LWP / Absent</div></div>
    <div class="att-card cf"><div class="num">${cfCount}</div><div class="lbl">Carry Fwd</div></div>
  </div>

  <div class="slbl">${monthLabel} &#8212; Daily Attendance Calendar</div>
  <table class="cal">
    ${calendarHTML}
  </table>

  <div class="legend">
    <div class="legend-item"><div class="legend-dot" style="background:#dcfce7;border-color:#86efac;"></div><span>Present</span></div>
    <div class="legend-item"><div class="legend-dot" style="background:#f8fafc;border-color:#bfdbfe;"></div><span>CL (Casual Leave / Weekly Off)</span></div>
    <div class="legend-item"><div class="legend-dot" style="background:#fcfbfe;border-color:#ddd6fe;"></div><span>SL (Sick Leave)</span></div>
    <div class="legend-item"><div class="legend-dot" style="background:#fffafb;border-color:#fecaca;"></div><span>LWP (Leave Without Pay / Absent)</span></div>
  </div>

  <div class="footer-note" style="margin-top: 30px;">
    This is an audit report compiled from official biometric punches and approved leave database.
    SS Brick and Clay Private Limited &#183; ${monthLabel}
  </div>
</div>

</body>
</html>`;

  // Save payslip to Supabase Storage (overwrites any existing one for the month)
  const filename = `payslip-${profileId}-${month}.html`;
  const fileUrl = await uploadPublicFile(
    "payslips",
    filename,
    Buffer.from(htmlContent, "utf-8"),
    "text/html; charset=utf-8",
  );

  // Also write locally to public/uploads/documents for local dev convenience
  try {
    const fs = require('fs');
    const path = require('path');
    const localDir = path.join(process.cwd(), 'public/uploads/documents');
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const monthsEng = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
    const monthNameEng = monthsEng[monthNum - 1] || "month";
    const friendlyFilename = `payslip-${employee.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${monthNameEng}-${year}.html`;
    fs.writeFileSync(path.join(localDir, friendlyFilename), htmlContent, 'utf-8');
  } catch (fsErr) {
    console.warn("Failed to write local backup:", fsErr);
  }

  // Upsert or insert document record in staff_documents table
  const { data: existingDoc } = await supabase
    .from("staff_documents")
    .select("id")
    .eq("profile_id", profileId)
    .eq("type", "salary_slip")
    .eq("month", month)
    .maybeSingle();

  if (existingDoc) {
    const { error: updateErr } = await supabase
      .from("staff_documents")
      .update({
        file_name: `Salary Slip - ${monthLabel}.html`,
        file_url: fileUrl,
        uploaded_by: owner.id,
        uploaded_at: new Date().toISOString(),
      })
      .eq("id", existingDoc.id);

    if (updateErr) {
      console.error("generatePayslip update error:", updateErr);
      return { error: updateErr.message };
    }
  } else {
    const { error: insertErr } = await supabase
      .from("staff_documents")
      .insert({
        profile_id: profileId,
        type: "salary_slip",
        month,
        file_url: fileUrl,
        file_name: `Salary Slip - ${monthLabel}.html`,
        uploaded_by: owner.id,
      });

    if (insertErr) {
      console.error("generatePayslip insert error:", insertErr);
      return { error: insertErr.message };
    }
  }

  return { ok: true, message: `Salary slip for ${monthLabel} generated successfully!` };
}

/** Update a staff profile with all contact, personal, and payroll details */
export async function updateStaffProfile(
  _prev: HRActionState,
  formData: FormData
): Promise<HRActionState> {
  try {
    const owner = await requireOwner();
    const supabase = createClient();

    const profileId = String(formData.get("profileId") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const personalEmail = String(formData.get("personalEmail") ?? "").trim();
    const phoneNumber = String(formData.get("phoneNumber") ?? "").trim();
    const aadhar = String(formData.get("aadhar") ?? "").trim();
    const pan = String(formData.get("pan") ?? "").trim();
    const address = String(formData.get("address") ?? "").trim();
    const employeeCode = String(formData.get("employeeCode") ?? "").trim();
    const dob = String(formData.get("dob") ?? "").trim();
    const biometricPin = String(formData.get("biometricPin") ?? "").trim();
    const biometricName = String(formData.get("biometricName") ?? "").trim();
    const basicPay = String(formData.get("basicPay") ?? "").trim();
    const paidThrough = String(formData.get("paidThrough") ?? "").trim();
    const designation = String(formData.get("designation") ?? "").trim();
    const dateOfJoining = String(formData.get("dateOfJoining") ?? "").trim();
    const workLocation = String(formData.get("workLocation") ?? "").trim();
    const workingHours = String(formData.get("workingHours") ?? "").trim();
    const employmentType = String(formData.get("employmentType") ?? "").trim();
    const reportingAuthority = String(formData.get("reportingAuthority") ?? "").trim();
    const teamRaw = String(formData.get("team") ?? "").trim();
    const team = teamRaw === "kitchen" || teamRaw === "front_desk" || teamRaw === "head_chef" ? teamRaw : null;

    const aadharFile = formData.get("aadharFile") as File | null;
    const panFile = formData.get("panFile") as File | null;

    if (!profileId || !name || !email) {
      return { error: "Name and Official Email are required." };
    }

    // Update profile text fields
    const { error } = await supabase
      .from("profiles")
      .update({
        name,
        email: email || null,
        personal_email: personalEmail || null,
        phone_number: phoneNumber || null,
        aadhar_number: aadhar || null,
        pan_number: pan || null,
        address: address || null,
        employee_code: employeeCode || null,
        dob: dob || null,
        biometric_pin: biometricPin || null,
        biometric_name: biometricName || null,
        basic_pay: basicPay ? parseFloat(basicPay) : null,
        paid_through: paidThrough || null,
        designation: designation || null,
        date_of_joining: dateOfJoining || null,
        work_location: workLocation || null,
        working_hours: workingHours || null,
        employment_type: employmentType || null,
        reporting_authority: reportingAuthority || null,
        team,
      })
      .eq("id", profileId);

    if (error) {
      console.error("updateStaffProfile database error:", error);
      return { error: error.message };
    }

    // Helper to upload document files
    const handleDocumentUpload = async (file: File, type: "aadhar_card" | "pan_card") => {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filename = `${Date.now()}-${type}-${cleanName}`;
        const fileUrl = await uploadPublicFile(
          "staff-docs",
          filename,
          buffer,
          file.type || "application/octet-stream",
        );

        // Upsert logic in staff_documents
        const { data: existingDoc } = await supabase
          .from("staff_documents")
          .select("id, file_url")
          .eq("profile_id", profileId)
          .eq("type", type)
          .maybeSingle();

        if (existingDoc) {
          // Delete old file (best-effort)
          await deletePublicFile(existingDoc.file_url);

          await supabase
            .from("staff_documents")
            .update({
              file_name: file.name,
              file_url: fileUrl,
              uploaded_by: owner.id,
              uploaded_at: new Date().toISOString(),
            })
            .eq("id", existingDoc.id);
        } else {
          await supabase.from("staff_documents").insert({
            profile_id: profileId,
            type,
            file_url: fileUrl,
            file_name: file.name,
            uploaded_by: owner.id,
          });
        }
      } catch (err) {
        console.error(`Failed to upload ${type}:`, err);
      }
    };

    if (aadharFile && aadharFile.size > 0) {
      await handleDocumentUpload(aadharFile, "aadhar_card");
    }
    if (panFile && panFile.size > 0) {
      await handleDocumentUpload(panFile, "pan_card");
    }

    revalidatePath("/profile");
    revalidatePath("/attendance");
    return { ok: true, message: "Staff profile updated successfully." };
  } catch (err: any) {
    console.error("updateStaffProfile exception:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}

/** Upload Owner Signature */
export async function uploadOwnerSignature(
  _prev: HRActionState,
  formData: FormData
): Promise<HRActionState> {
  try {
    const owner = await requireOwner();
    const supabase = createClient();
    const file = formData.get("signatureFile") as File;

    if (!file || file.size === 0) {
      return { error: "Please select a signature image file to upload." };
    }

    // Upload signature to Supabase Storage
    let fileUrl = "";
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filename = `${owner.id}-sig-${Date.now()}-${cleanName}`;
      fileUrl = await uploadPublicFile(
        "signatures",
        filename,
        buffer,
        file.type || "application/octet-stream",
      );
    } catch (uploadErr: any) {
      console.error("Signature file upload failed:", uploadErr);
      return { error: "File upload failed: " + uploadErr.message };
    }

    // Update owner's profile with signature_url
    const { error } = await supabase
      .from("profiles")
      .update({ signature_url: fileUrl })
      .eq("id", owner.id);

    if (error) {
      console.error("uploadOwnerSignature database error:", error);
      return { error: error.message };
    }

    revalidatePath("/profile");
    revalidatePath("/attendance");
    return { ok: true, message: "Authorized signature uploaded successfully." };
  } catch (err: any) {
    console.error("uploadOwnerSignature exception:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}
