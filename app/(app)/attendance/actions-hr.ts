"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, requireOwner } from "@/lib/auth";
import { todayIST, isTodaySettledIST } from "@/lib/date";
import { uploadPublicFile, deletePublicFile } from "@/lib/storage";
import { whatsappNotify } from "@/lib/whatsapp-notify";
import { notifyOwner, notifyStaff, sendPushToProfile } from "@/lib/push";
import { SIGNATURE_DATA_URI, STAMP_DATA_URI } from "@/lib/payslip-assets";
import { renderPayslipHtml, formatINR } from "@/lib/payslip-template";
import { buildMonthAttendance } from "@/lib/leave-policy";

export type HRActionState = { ok?: boolean; error?: string; message?: string; html?: string };

// ── LEAVE MANAGEMENT ACTIONS ──────────────────────────────────────────────────

/** Apply for a leave */
export async function applyLeave(
  _prev: HRActionState,
  formData: FormData
): Promise<HRActionState> {
  try {
    const profile = await requireProfile();
    const supabase = createClient();

    const leaveType = String(formData.get("leaveType") ?? "").trim() as "cl" | "lwp";
    const startDateStr = String(formData.get("startDate") ?? "").trim();
    const endDateStr = String(formData.get("endDate") ?? "").trim();
    const reason = String(formData.get("reason") ?? "").trim();

    // Sick leave was withdrawn from 1 Aug 2026. It is gone from the apply form,
    // but reject it here too so a stale client or a hand-crafted request can't
    // create new SL rows. Existing SL records stay untouched and still count on
    // July 2026 and earlier payslips.
    if (String(leaveType) === "sl") {
      return { error: "Sick Leave is no longer available. Please apply for Weekly Leave / CL or LWP." };
    }

    if (!leaveType || (leaveType !== "cl" && leaveType !== "lwp")) {
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

/** Finalize a draft payslip by providing payment date and reference number */
export async function finalizePayslip(
  _prev: HRActionState,
  formData: FormData
): Promise<HRActionState> {
  try {
    const owner = await requireOwner();
    const supabase = createClient();

    const docId = String(formData.get("docId") ?? "").trim();
    const paymentDate = String(formData.get("paymentDate") ?? "").trim();
    const paymentReference = String(formData.get("paymentReference") ?? "").trim();
    // Editable actual amount paid — falls back to the employee's basic pay below.
    const amountPaidInput = String(formData.get("amountPaid") ?? "").trim();

    if (!docId || !paymentDate || !paymentReference) {
      return { error: "Payment date and reference number are required to finalize." };
    }

    // Fetch the document record to get profile_id and month
    const { data: doc, error: docErr } = await supabase
      .from("staff_documents")
      .select("*")
      .eq("id", docId)
      .single();

    if (docErr || !doc) {
      return { error: "Payslip record not found." };
    }

    // Fetch the employee's full profile
    const { data: employee, error: empErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", doc.profile_id)
      .single();

    if (empErr || !employee) {
      return { error: "Employee profile not found." };
    }

    // Build FormData for the internal generator
    const subFormData = new FormData();
    subFormData.append("profileId", employee.id);
    subFormData.append("month", doc.month || "");
    subFormData.append("employeeCode", employee.employee_code || "");
    subFormData.append("dob", employee.dob || "");
    subFormData.append("aadhar", employee.aadhar_number || "");
    subFormData.append("pan", employee.pan_number || "");
    subFormData.append("basicPay", String(employee.basic_pay || 0));
    subFormData.append("amountPaid", amountPaidInput || String(employee.basic_pay || 0));
    subFormData.append("paidThrough", employee.paid_through || "Cash");

    const res = await generatePayslipInternal(supabase, owner, employee, subFormData, {
      isDraft: false,
      paymentDate,
      paymentReference,
    });

    if (res.error) return { error: res.error };

    // Notify the employee that their finalized payslip is now available.
    try {
      const [yStr, mStr] = (doc.month || "").split("-");
      const monthLabel = yStr && mStr
        ? new Date(parseInt(yStr), parseInt(mStr) - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
        : "your salary";
      await sendPushToProfile(
        employee.id,
        "Payslip ready 📄",
        `Your salary slip for ${monthLabel} has been finalized and is now available in My Documents.`,
        "/profile",
      );
    } catch (pushErr) {
      console.warn("finalizePayslip push failed:", pushErr);
    }

    revalidatePath("/profile");
    revalidatePath("/attendance");
    return { ok: true, message: res.message };
  } catch (err: any) {
    console.error("finalizePayslip exception:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}

/**
 * Save (create or update) a manual payroll override for one employee/month.
 * Any field left blank in the form is stored as null, meaning "use the
 * computed value" — the owner only needs to fill in what's actually different
 * from what attendance/leave records would otherwise produce.
 */
export async function savePayrollOverride(
  _prev: HRActionState,
  formData: FormData,
): Promise<HRActionState> {
  try {
    const owner = await requireOwner();
    const supabase = createClient();

    const profileId = String(formData.get("profileId") ?? "").trim();
    const month = String(formData.get("month") ?? "").trim();
    if (!profileId || !month) return { error: "Missing employee or month." };

    const num = (key: string) => {
      const raw = String(formData.get(key) ?? "").trim();
      if (raw === "") return null;
      const n = parseFloat(raw);
      return isNaN(n) ? null : n;
    };
    const str = (key: string) => {
      const raw = String(formData.get(key) ?? "").trim();
      return raw === "" ? null : raw;
    };

    const { error } = await supabase.from("payroll_overrides").upsert(
      {
        profile_id: profileId,
        month,
        present_days: num("presentDays"),
        cl_days: num("clDays"),
        sl_days: num("slDays"),
        lwp_days: num("lwpDays"),
        basic_pay_override: num("basicPayOverride"),
        extra_duty_amount: num("extraDutyAmount"),
        extra_duty_label: str("extraDutyLabel"),
        bonus_amount: num("bonusAmount"),
        bonus_label: str("bonusLabel"),
        incentive_amount: num("incentiveAmount"),
        incentive_label: str("incentiveLabel"),
        other_deduction_amount: num("otherDeductionAmount"),
        other_deduction_label: str("otherDeductionLabel"),
        half_days: str("halfDays"),
        notes: str("notes"),
        updated_by: owner.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "profile_id,month" },
    );

    if (error) return { error: error.message };
    revalidatePath("/attendance");
    revalidatePath("/profile");
    return { ok: true, message: "Overrides saved. The payslip will reflect them immediately." };
  } catch (err: any) {
    console.error("savePayrollOverride exception:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}

/** Clear all manual overrides for one employee/month, reverting to computed values. */
export async function clearPayrollOverride(profileId: string, month: string): Promise<HRActionState> {
  try {
    await requireOwner();
    const supabase = createClient();
    const { error } = await supabase
      .from("payroll_overrides")
      .delete()
      .eq("profile_id", profileId)
      .eq("month", month);
    if (error) return { error: error.message };
    revalidatePath("/attendance");
    revalidatePath("/profile");
    return { ok: true, message: "Overrides cleared." };
  } catch (err: any) {
    console.error("clearPayrollOverride exception:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}

/**
 * Render a payslip live from CURRENT data (profile, advances, stored payment
 * details) — no stale stored snapshot. Used by /api/payslip so any change to an
 * employee's data or advances is reflected the next time the slip is opened.
 * Enforces access: owner sees all; everyone else only their own visible slip.
 */
export async function renderLivePayslip(
  docId: string,
  adminClient?: any,
): Promise<{ html?: string; error?: string; status?: number }> {
  try {
    // Scripts pass a service-role client to render without a session. This file
    // is "use server", so this export is also callable from a browser — but a
    // browser can only send serialised data, never an object with methods, so
    // only a real client (one with .from) may skip the access check below.
    const trustedClient = typeof adminClient?.from === "function" ? adminClient : null;
    const supabase = trustedClient || createClient();

    const { data: doc, error: docErr } = await supabase
      .from("staff_documents")
      .select("*")
      .eq("id", docId)
      .single();
    if (docErr || !doc) return { error: "Payslip not found.", status: 404 };

    if (!trustedClient) {
      const profile = await requireProfile();
      // Access: staff may only view their own visible slip; owner sees all.
      if (profile.role !== "owner") {
        if (doc.profile_id !== profile.id || !doc.is_visible_to_staff) {
          return { error: "Forbidden.", status: 403 };
        }
      }
    }

    const { data: employee, error: empErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", doc.profile_id)
      .single();
    if (empErr || !employee) return { error: "Employee profile not found.", status: 404 };

    // Owner profile is only used for the signature fallback lookup.
    const { data: owner } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "owner")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    const isFinal = !!(doc.payment_date && doc.payment_reference);

    const fd = new FormData();
    fd.append("profileId", employee.id);
    fd.append("month", doc.month || "");
    fd.append("employeeCode", employee.employee_code || "");
    fd.append("dob", employee.dob || "");
    fd.append("aadhar", employee.aadhar_number || "");
    fd.append("pan", employee.pan_number || "");
    fd.append("basicPay", String(employee.basic_pay || 0));
    fd.append("amountPaid", doc.amount_paid != null ? String(doc.amount_paid) : String(employee.basic_pay || 0));
    fd.append("paidThrough", doc.payment_mode || employee.paid_through || "Cash");

    const res = await generatePayslipInternal(supabase, owner || employee, employee, fd, {
      isDraft: !isFinal,
      paymentDate: doc.payment_date || undefined,
      paymentReference: doc.payment_reference || undefined,
      renderOnly: true,
    });

    if (res.error || !res.html) return { error: res.error || "Failed to render payslip.", status: 500 };
    return { html: res.html };
  } catch (err: any) {
    console.error("renderLivePayslip exception:", err);
    return { error: err.message || "Failed to render payslip.", status: 500 };
  }
}

/** Private helper function to handle payslip generation logic for a single staff member */
async function generatePayslipInternal(
  supabase: any,
  owner: any,
  employee: any,
  formData: FormData,
  opts: { isDraft?: boolean; paymentDate?: string; paymentReference?: string; renderOnly?: boolean } = {}
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

  // Read payment fields from formData if not passed directly via opts
  const isDraft = opts.isDraft !== false
    ? (String(formData.get("paymentDate") ?? "").trim() === "" || String(formData.get("paymentReference") ?? "").trim() === "")
    : false;
  const paymentDate = opts.paymentDate || String(formData.get("paymentDate") ?? "").trim();
  const paymentReference = opts.paymentReference || String(formData.get("paymentReference") ?? "").trim();

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

  // Resolve assigned outlet name (profiles.outlet_id)
  let assignedOutletName = "Not Assigned";
  if (employee.outlet_id) {
    const { data: outletRow } = await supabase
      .from("outlets")
      .select("name")
      .eq("id", employee.outlet_id)
      .maybeSingle();
    if (outletRow) assignedOutletName = outletRow.name;
  }

  const teamLabel =
    employee.team === "head_chef" ? "Head Chef / Kitchen"
    : employee.team === "kitchen" ? "Kitchen"
    : employee.team === "front_desk" ? "Front Desk"
    : "Not Assigned";

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

  // 2. Attendance for this month — union of QR check-ins (current system) and
  // legacy biometric punches (historical months imported from the machine).
  const { data: punches } = await supabase
    .from("attendance_punches")
    .select("date")
    .eq("profile_id", profileId)
    .gte("date", startOfMonthStr)
    .lte("date", endOfMonthStr);

  const attendedDates = new Set<string>((punches ?? []).map((p: any) => p.date));

  try {
    const { data: checkins } = await supabase
      .from("attendance_checkins")
      .select("date")
      .eq("profile_id", profileId)
      .gte("date", startOfMonthStr)
      .lte("date", endOfMonthStr);
    for (const c of checkins ?? []) attendedDates.add((c as any).date);
  } catch {
    // Table may not exist yet — fall back to punches only.
  }

  // 2a-2. Manual override for this employee/month, if the owner has set one
  // (Payroll tab → Manual Overrides). Any field left blank falls back to the
  // computed value — this replaces having to hardcode a per-employee/month
  // exception in code every time reality doesn't match the biometric/leave
  // records.
  let override: any = null;
  try {
    const { data: overrideRow } = await supabase
      .from("payroll_overrides")
      .select("*")
      .eq("profile_id", profileId)
      .eq("month", month)
      .maybeSingle();
    override = overrideRow;
  } catch {
    override = null;
  }

  // 2b. Fetch advance deductions for this staff member and month
  // In final mode: only deduct advances with advance_date <= paymentDate
  // In draft mode: deduct all current-month advances
  let totalAdvance = 0;
  let advanceRows: Array<{ amount: number; notes: string | null; advance_date: string | null }> = [];
  try {
    let advQuery = supabase
      .from("payroll_advances")
      .select("amount, notes, advance_date")
      .eq("profile_id", profileId)
      .eq("month", month);
    if (!isDraft && paymentDate) {
      advQuery = advQuery.lte("advance_date", paymentDate);
    }
    const { data: advances } = await advQuery;
    if (advances && advances.length > 0) {
      advanceRows = advances;
      totalAdvance = advances.reduce((sum: number, a: any) => sum + Number(a.amount), 0);
    }
  } catch {
    // Table may not exist yet — silently skip
  }

  // 2c. Fetch next month advances
  // Draft: these are ALSO deducted from net pay (salary paid next month means these are already taken)
  // Final: filter by advance_date <= paymentDate; show remainder as upcoming
  const nextMonthNum = monthNum === 12 ? 1 : monthNum + 1;
  const nextYear = monthNum === 12 ? year + 1 : year;
  const nextMonthStr = `${nextYear}-${String(nextMonthNum).padStart(2, "0")}`;
  let nextMonthAdvancesAll: Array<{ amount: number; notes: string | null; advance_date: string | null }> = [];
  let nextMonthAdvancesDeducted: Array<{ amount: number; notes: string | null; advance_date: string | null }> = [];
  let nextMonthAdvancesUpcoming: Array<{ amount: number; notes: string | null; advance_date: string | null }> = [];
  let totalNextMonthAdvance = 0;
  try {
    const { data: nextAdvs } = await supabase
      .from("payroll_advances")
      .select("amount, notes, advance_date")
      .eq("profile_id", profileId)
      .eq("month", nextMonthStr);
    if (nextAdvs && nextAdvs.length > 0) {
      // Advances carry the payroll month they are CHARGED TO (`month`), separate
      // from when they were taken (`advance_date`). An advance taken in early
      // July but charged to June is stored with month = June, so it is already
      // covered by totalAdvance above.
      //
      // Next-month advances therefore belong to NEXT month's payslip and are
      // never deducted here — they're shown as upcoming information only.
      // (Previously drafts auto-deducted them, which double-counted the ones
      // charged to this month and made a finalised month's figures drift every
      // time a new advance was recorded in the following month.)
      nextMonthAdvancesAll = nextAdvs;
      nextMonthAdvancesUpcoming = nextAdvs;
      totalNextMonthAdvance = 0;
    }
  } catch {
    // silently skip
  }

  // 3. Build Daily Calendar & Count Stats
  const isBiswajeetJune2026 =
    (employee.name.toLowerCase().includes("biswajeet") || employee.name.toLowerCase().includes("kandi")) &&
    month === "2026-06";

  // One-off manual corrections for June 2026 where the owner's authoritative
  // figures don't map onto whole-day leave/attendance records (the DB only
  // stores whole days). These override the DISPLAYED stats and, for Manoj,
  // the LWP deduction math — the underlying leave/attendance rows are left as
  // the closest whole-day equivalent for audit purposes.
  const isPradoshJune2026 =
    employee.name.toLowerCase().includes("pradosh") && month === "2026-06";
  const isManojJune2026 =
    employee.name.toLowerCase().includes("manoj") &&
    (employee.name.toLowerCase().includes("naik") || employee.name.toLowerCase().includes("nayak")) &&
    month === "2026-06";

  // Attendance, leave counts and unpaid days all come from the shared policy
  // module so payroll, leave balances and reports can never disagree.
  const summary = buildMonthAttendance({
    year,
    monthNum,
    today: todayIST(),
    leaves: (leaves ?? []) as any,
    attendedDates,
    assumePresent: isBiswajeetJune2026,
    joiningDate: employee.date_of_joining ?? null,
    // A mid-month payslip must not deduct for a shift still in progress.
    todaySettled: isTodaySettledIST(),
  });

  const presentCount = summary.presentCount;
  const clCount = summary.clCount;
  const slCount = summary.slCount;
  // Unpaid = approved LWP + unexplained absence. Future days are never unpaid.
  const lwpCount = summary.unpaidCount;

  const calendarDays = summary.days.map((d) => {
    switch (d.status) {
      case "cl":      return { dayNum: d.dayNum, class: "cl-day",  statusLabel: "CL" };
      case "sl":      return { dayNum: d.dayNum, class: "sl-day",  statusLabel: "SL" };
      case "lwp":     return { dayNum: d.dayNum, class: "lwp-day", statusLabel: "LWP" };
      case "absent":  return { dayNum: d.dayNum, class: "lwp-day", statusLabel: "LWP" };
      // Today, still on shift — blank like a future day. Nothing is deducted
      // for it until the day settles.
      case "pending": return { dayNum: d.dayNum, class: "empty",   statusLabel: "" };
      case "future":  return { dayNum: d.dayNum, class: "empty",   statusLabel: "" };
      case "not_employed": return { dayNum: d.dayNum, class: "empty", statusLabel: "—" };
      default:        return { dayNum: d.dayNum, class: "present", statusLabel: "" };
    }
  });

  // Pradosh June 2026: day 25 is a neutral "Carry Forward" day — paid, not
  // deducted, but also not counted in the Present tally (matches the owner's
  // manually-supplied figures exactly; net salary is unaffected either way).
  if (isPradoshJune2026) {
    const cfDay = calendarDays.find((c) => c.dayNum === 25);
    if (cfDay) { cfDay.class = "cf-day"; cfDay.statusLabel = "CF"; }
  }
  // Manoj June 2026: day 30 is a half-present / half-LWP day — the schema
  // only stores whole days, so it's recorded as LWP; label it distinctly here.
  if (isManojJune2026) {
    const halfDay = calendarDays.find((c) => c.dayNum === 30);
    if (halfDay) { halfDay.statusLabel = "½ LWP"; }
  }

  // Half days recorded on the override (e.g. "13,18") — the schema stores only
  // whole days, so these are flagged here and the pay impact comes from the
  // present_days / lwp_days override values.
  if (override?.half_days) {
    const halfDayNums = String(override.half_days)
      .split(",")
      .map((s: string) => parseInt(s.trim(), 10))
      .filter((n: number) => Number.isFinite(n));
    for (const dayNum of halfDayNums) {
      const cell = calendarDays.find((c) => c.dayNum === dayNum);
      if (cell) { cell.class = "cf-day"; cell.statusLabel = "½ Day"; }
    }
  }

  // Display-only overrides for the two June 2026 corrections above — the
  // underlying leave/attendance rows stay as the closest whole-day equivalent.
  // A manual override (if set) takes final precedence over both the computed
  // value and these one-off historical corrections.
  const presentCountDisplay = override?.present_days != null ? Number(override.present_days)
    : isPradoshJune2026 ? 24 : isManojJune2026 ? 18.5 : presentCount;
  const clCountDisplay = override?.cl_days != null ? Number(override.cl_days) : clCount;
  const slCountDisplay = override?.sl_days != null ? Number(override.sl_days) : slCount;
  const lwpCountDisplay = override?.lwp_days != null ? Number(override.lwp_days)
    : isManojJune2026 ? 5.5 : lwpCount;
  // The days actually used in the pay calculation below (may differ from the
  // whole-day database records when an override or a historical correction
  // applies a fractional value).
  const lwpDaysForCalc = override?.lwp_days != null ? Number(override.lwp_days)
    : isManojJune2026 ? 5.5 : lwpCount;

  // Mid-month joiner: pro-rate the monthly basic by the days actually employed,
  // rather than docking the pre-joining days as if they were unpaid leave.
  const isPartialMonth = summary.employedDays < summary.daysInMonth;
  const proRatedBasic = isPartialMonth
    ? (parseFloat(basicPay) * summary.employedDays) / summary.daysInMonth
    : parseFloat(basicPay);

  const effectiveBasicPay = override?.basic_pay_override != null
    ? Number(override.basic_pay_override)
    : proRatedBasic;

  // 4. Calculate LWP deduction, advance deduction, and net salary
  // Daily rate is always the FULL monthly basic ÷ days in month, so an LWP day
  // is docked at the same rate regardless of a mid-month joining pro-rate.
  const fullMonthlyBasic = override?.basic_pay_override != null
    ? Number(override.basic_pay_override)
    : parseFloat(basicPay);
  const dailyRate = fullMonthlyBasic / maxDay;
  const extraDutyPayment = override?.extra_duty_amount != null
    ? Number(override.extra_duty_amount)
    : isBiswajeetJune2026 ? 13 * dailyRate : 0;
  const extraDutyLabel = override?.extra_duty_label || "Extra Duty Allowance";
  const bonusAmount = override?.bonus_amount != null ? Number(override.bonus_amount) : 0;
  const bonusLabel = override?.bonus_label || "Bonus";
  const incentiveAmount = override?.incentive_amount != null ? Number(override.incentive_amount) : 0;
  const incentiveLabel = override?.incentive_label || "Incentive";
  const otherDeductionAmount = override?.other_deduction_amount != null ? Number(override.other_deduction_amount) : 0;
  const otherDeductionLabel = override?.other_deduction_label || "Other Deduction";

  const lwpDeduction = lwpDaysForCalc * dailyRate;
  const grossBeforeAdvance = Math.max(
    0,
    effectiveBasicPay + extraDutyPayment + bonusAmount + incentiveAmount - lwpDeduction - otherDeductionAmount,
  );
  const totalAllAdvances = totalAdvance + totalNextMonthAdvance;
  const netSalary = Math.max(0, grossBeforeAdvance - totalAllAdvances);
  const amountPaidNum = amountPaid ? Math.max(0, parseFloat(amountPaid) - totalAllAdvances) : netSalary;
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

  // Signature: prefer local file in public/uploads or Assets, then uploaded URL, then embedded fallback.
  let signatureBase64 = "";
  let stampBase64 = STAMP_DATA_URI;
  let signatoryName = "Soumyashree Das";
  let signatoryTitle = "Managing Director";

  try {
    const fs = require('fs');
    const path = require('path');
    const sigPaths = [
      path.join(process.cwd(), 'public', 'uploads', 'Soumyashree Das Signature.png'),
      path.join(process.cwd(), 'Assets', 'Soumyashree Das Signature.png'),
    ];
    for (const sp of sigPaths) {
      if (fs.existsSync(sp)) {
        const sigBuf = fs.readFileSync(sp);
        signatureBase64 = `data:image/png;base64,${sigBuf.toString("base64")}`;
        break;
      }
    }
  } catch (sigErr) {
    console.warn("Local signature load failed:", sigErr);
  }

  // Try an uploaded signature first if not loaded from disk
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

  // No uploaded signature → use Soumyashree Das signature from public/uploads or embedded asset
  if (!signatureBase64) {
    try {
      const fs = await import("fs");
      const path = await import("path");
      const sigPath = path.join(process.cwd(), "public", "uploads", "Soumyashree Das Signature.png");
      if (fs.existsSync(sigPath)) {
        const buf = fs.readFileSync(sigPath);
        signatureBase64 = `data:image/png;base64,${buf.toString("base64")}`;
      }
    } catch {
      // Fallback
    }
  }
  if (!signatureBase64) signatureBase64 = SIGNATURE_DATA_URI;

  // Hand-set day counts (Payroll → Manual Overrides) can't be placed on
  // specific dates, so the day-by-day grid is left off rather than shown
  // disagreeing with the totals above it.
  const countsOverridden =
    override?.present_days != null || override?.cl_days != null || override?.lwp_days != null;

  const takenOn = (d: string | null) =>
    d ? `Taken ${new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : undefined;
  const nextMonthLabel = new Date(nextYear, nextMonthNum - 1, 1)
    .toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const htmlContent = renderPayslipHtml({
    period: monthLabel,
    status: isDraft ? "draft" : "final",
    employee: {
      name: employee.name,
      code: employeeCode,
      designation: employee.designation,
      department: teamLabel === "Not Assigned" ? null : teamLabel,
      outlet: assignedOutletName === "Not Assigned" ? null : assignedOutletName,
      joined: employee.date_of_joining,
      pan,
      aadhar,
    },
    attendance: [
      { label: "Present", value: presentCountDisplay },
      { label: "Leave", value: clCountDisplay },
      ...(slCountDisplay > 0 ? [{ label: "Sick leave", value: slCountDisplay }] : []),
      { label: "Unpaid", value: lwpCountDisplay },
      { label: "Days in month", value: maxDay },
    ],
    earnings: [
      {
        label: "Basic salary",
        detail: isPartialMonth ? `${summary.employedDays} of ${maxDay} days, from date of joining` : `${maxDay}-day month`,
        amount: effectiveBasicPay,
      },
      ...(extraDutyPayment > 0 ? [{ label: extraDutyLabel, amount: extraDutyPayment }] : []),
      ...(bonusAmount > 0 ? [{ label: bonusLabel, amount: bonusAmount }] : []),
      ...(incentiveAmount > 0 ? [{ label: incentiveLabel, amount: incentiveAmount }] : []),
    ],
    deductions: [
      ...(lwpDaysForCalc > 0
        ? [{ label: "Unpaid leave (LWP)", detail: `${lwpCountDisplay} days × ${formatINR(dailyRate)}`, amount: lwpDeduction }]
        : []),
      ...(otherDeductionAmount > 0 ? [{ label: otherDeductionLabel, amount: otherDeductionAmount }] : []),
      ...advanceRows.map((a) => ({ label: "Advance", detail: takenOn(a.advance_date), amount: Number(a.amount) })),
    ],
    net: netSalary,
    notes: nextMonthAdvancesUpcoming.map(
      (a) => `${formatINR(Number(a.amount))} advance will be recovered from ${nextMonthLabel} salary.`,
    ),
    payment: !isDraft && paymentDate && paymentReference
      ? { date: paymentDate, mode: paidThrough, reference: paymentReference, amount: amountPaidNum }
      : undefined,
    calendar: countsOverridden
      ? undefined
      : {
          leadingBlanks: (startOfMonth.getDay() + 6) % 7, // Monday-first week
          days: calendarDays.map((c) => ({
            dayNum: c.dayNum,
            label: c.class === "present" ? "P" : c.statusLabel,
            kind:
              c.class === "present" ? "present"
              : c.class === "cl-day" || c.class === "sl-day" ? "leave"
              : c.class === "lwp-day" ? "unpaid"
              : c.class === "cf-day" ? "other"
              : "none",
          })),
        },
    signatory: { name: signatoryName, title: signatoryTitle, signature: signatureBase64, stamp: stampBase64 },
    logo: logoBase64 || undefined,
  });

  // Live render path: return the freshly-built HTML without touching storage or
  // the document record. Used by /api/payslip to render slips from current data.
  if (opts.renderOnly) {
    return { ok: true, html: htmlContent };
  }

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

  const docFileName = isDraft
    ? `[DRAFT] Salary Slip - ${monthLabel}.html`
    : `Salary Slip - ${monthLabel}.html`;

  // Drafts stay hidden from staff; finalized slips are auto-published to the
  // employee and carry the payment summary so it shows on their profile card.
  const paymentFields = isDraft
    ? {
        is_visible_to_staff: false,
        payment_date: null,
        payment_reference: null,
        payment_mode: null,
        amount_paid: null,
      }
    : {
        is_visible_to_staff: true,
        payment_date: paymentDate || null,
        payment_reference: paymentReference || null,
        payment_mode: paidThrough || null,
        amount_paid: amountPaidNum,
      };

  if (existingDoc) {
    const { error: updateErr } = await supabase
      .from("staff_documents")
      .update({
        file_name: docFileName,
        file_url: fileUrl,
        uploaded_by: owner.id,
        uploaded_at: new Date().toISOString(),
        ...paymentFields,
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
        file_name: docFileName,
        uploaded_by: owner.id,
        ...paymentFields,
      });

    if (insertErr) {
      console.error("generatePayslip insert error:", insertErr);
      return { error: insertErr.message };
    }
  }

  return {
    ok: true,
    message: isDraft
      ? `Draft payslip for ${monthLabel} saved. Enter payment date & reference to finalize.`
      : `Final salary slip for ${monthLabel} generated and payment confirmed!`,
  };
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
    const outletId = String(formData.get("outletId") ?? "").trim();
    const isHouseHelper = String(formData.get("isHouseHelper") ?? "false") === "true";

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
        outlet_id: outletId || null,
        is_house_helper: isHouseHelper,
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
