"use server";

import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, requireOwner } from "@/lib/auth";
import { todayIST } from "@/lib/date";

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

    // Save file locally to public/uploads/documents
    let fileUrl = "";
    try {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filename = `${Date.now()}-${type}-${cleanName}`;
      const docDir = path.join(process.cwd(), "public", "uploads", "documents");
      
      await fs.mkdir(docDir, { recursive: true });
      const filePath = path.join(docDir, filename);
      await fs.writeFile(filePath, buffer);
      fileUrl = `/uploads/documents/${filename}`;
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
      try {
        const filePath = path.join(process.cwd(), "public", fileUrl);
        await fs.unlink(filePath);
      } catch (cleanupErr) {
        console.error("Cleanup uploaded file failed:", cleanupErr);
      }

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

    // Attempt to delete file from local storage
    try {
      const filePath = path.join(process.cwd(), "public", doc.file_url);
      await fs.unlink(filePath);
    } catch (fsErr: any) {
      // Log error but don't fail the action if file was already missing
      console.warn("Could not delete file from disk:", fsErr.message);
    }

    revalidatePath("/profile");
    revalidatePath("/attendance");
    return { ok: true, message: "Document deleted successfully." };
  } catch (err: any) {
    console.error("deleteStaffDocument exception:", err);
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
    const month = String(formData.get("month") ?? "").trim();
    const employeeCode = String(formData.get("employeeCode") ?? "").trim();
    const dob = String(formData.get("dob") ?? "").trim();
    const aadhar = String(formData.get("aadhar") ?? "").trim();
    const pan = String(formData.get("pan") ?? "").trim();
    const basicPay = String(formData.get("basicPay") ?? "").trim();
    const amountPaid = String(formData.get("amountPaid") ?? "").trim();
    const paidThrough = String(formData.get("paidThrough") ?? "").trim();

    if (!profileId || !month || !employeeCode || !dob || !aadhar || !pan || !basicPay || !amountPaid || !paidThrough) {
      return { error: "Please fill in all required fields." };
    }

    // Fetch employee profile with all details
    const { data: employee, error: empErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .single();

    if (empErr || !employee) {
      return { error: "Selected staff member not found." };
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
      console.warn("Failed to update staff profile fields (database migration might not have been applied):", profileUpdateErr);
    }

    // Format Month Label (e.g. "June 2026")
    const [yearStr, monthStr] = month.split("-");
    const date = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
    const monthLabel = date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

    // Load corporate logo as base64
    let logoBase64 = "";
    try {
      const logoPath = path.join(process.cwd(), "public", "brand", "logo-full.png");
      const logoBuffer = await fs.readFile(logoPath);
      logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
    } catch (logoErr) {
      console.warn("Logo file not found:", logoErr);
    }

    // Fetch owner profile to retrieve their signature
    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("signature_url, name")
      .eq("id", owner.id)
      .single();

    let signatureBase64 = "";
    if (ownerProfile?.signature_url) {
      try {
        const sigPath = path.join(process.cwd(), "public", ownerProfile.signature_url);
        const sigBuffer = await fs.readFile(sigPath);
        signatureBase64 = `data:image/png;base64,${sigBuffer.toString("base64")}`;
      } catch (sigErr) {
        console.warn("Signature file not found on disk:", sigErr);
      }
    }

    // Helper to safely format dates from YYYY-MM-DD to DD/MM/YYYY
    const formatDateStr = (d: string | null | undefined) => {
      if (!d) return "Not Provided";
      const parts = d.split("-");
      if (parts.length !== 3) return d;
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    };

    // Generate Beautiful HTML Content
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Payslip - ${employee.name} - ${monthLabel}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', sans-serif;
      color: #1e293b;
      background-color: #f8fafc;
      margin: 0;
      padding: 30px;
      line-height: 1.5;
    }
    .payslip-card {
      max-width: 800px;
      margin: 0 auto;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 40px;
      background-color: #ffffff;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
    }
    .header-container {
      background-color: #0f172a;
      padding: 25px 30px;
      border-radius: 12px;
      margin-bottom: 30px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
    }
    .header-table td {
      border: none;
      padding: 0;
      vertical-align: middle;
    }
    .logo-container {
      width: 40%;
    }
    .logo-img {
      max-height: 48px;
      max-width: 190px;
      object-fit: contain;
    }
    .company-details {
      text-align: right;
      width: 60%;
    }
    .company-title {
      font-size: 14px;
      font-weight: 800;
      color: #ffffff;
      margin: 0 0 6px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .company-info {
      font-size: 10.5px;
      color: #94a3b8;
      margin: 2px 0;
    }
    .banner {
      background-color: #fff7ed;
      border: 1px solid #ffedd5;
      border-radius: 10px;
      padding: 12px 20px;
      text-align: center;
      margin-bottom: 30px;
    }
    .banner h2 {
      font-size: 14px;
      font-weight: 800;
      color: #ea580c;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }
    .section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #475569;
      border-bottom: 1.5px solid #e2e8f0;
      padding-bottom: 6px;
      margin-top: 25px;
      margin-bottom: 12px;
      letter-spacing: 0.8px;
    }
    .grid-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 12px;
    }
    .grid-table td {
      padding: 10px 14px;
      border: 1px solid #e2e8f0;
      width: 25%;
    }
    .grid-table td.label {
      font-weight: 500;
      color: #64748b;
      background-color: #f8fafc;
    }
    .grid-table td.value {
      color: #0f172a;
      font-weight: 600;
    }
    .summary-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      font-size: 12px;
    }
    .summary-table th {
      background-color: #0f172a;
      color: #ffffff;
      font-weight: 600;
      text-align: left;
      padding: 10px 14px;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.5px;
      width: 50%;
    }
    .summary-table td {
      padding: 12px 14px;
      border: 1px solid #e2e8f0;
    }
    .summary-table tr.total-row td {
      background-color: #f8fafc;
    }
    .amount-value {
      font-weight: 700;
      color: #0f172a;
    }
    .net-salary-value {
      font-weight: 800;
      color: #ea580c;
      font-size: 13px;
    }
    .paid-value {
      font-weight: 700;
      color: #16a34a;
      font-size: 13px;
    }
    .footer-sig {
      display: flex;
      justify-content: flex-end;
      margin-top: 50px;
      padding-top: 20px;
    }
    .sig-block {
      text-align: center;
      width: 40%;
    }
    .sig-image-container {
      height: 60px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      margin-bottom: 8px;
    }
    .sig-line {
      border-top: 1.5px dashed #cbd5e1;
      margin-top: 8px;
      margin-bottom: 8px;
    }
    .sig-label {
      font-size: 10.5px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .sig-name {
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    @media print {
      body {
        padding: 0;
        background-color: #ffffff;
      }
      .payslip-card {
        border: none;
        box-shadow: none;
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="payslip-card">
    <div class="header-container">
      <table class="header-table">
        <tr>
          <td class="logo-container">
            ${logoBase64 ? `<img src="${logoBase64}" class="logo-img" alt="Brick & Clay Logo" />` : `<strong style="font-size: 20px; color: #ea580c; letter-spacing: 0.5px;">BRICK & CLAY</strong>`}
          </td>
          <td class="company-details">
            <h1 class="company-title">SSBRICK AND CLAY PRIVATE LIMITED</h1>
            <p class="company-info">C-3, Ground Floor, Inox Block, BMC Bhawani Mall</p>
            <p class="company-info">Saheed Nagar, Bhubaneswar, Odisha. 751007</p>
            <p class="company-info">Contact: +91 79784 45822 | Email: hr@brickandclay.in</p>
          </td>
        </tr>
      </table>
    </div>

    <div class="banner">
      <h2>Salary Slip for ${monthLabel}</h2>
    </div>

    <div class="section-title">Employee Information</div>
    <table class="grid-table">
      <tr>
        <td class="label">Employee Name</td>
        <td class="value" colspan="3">${employee.name}</td>
      </tr>
      <tr>
        <td class="label">Employee Code</td>
        <td class="value">${employeeCode}</td>
        <td class="label">Designation</td>
        <td class="value">${employee.designation || "Not Provided"}</td>
      </tr>
      <tr>
        <td class="label">Date of Birth</td>
        <td class="value">${formatDateStr(dob)}</td>
        <td class="label">Date of Joining</td>
        <td class="value">${formatDateStr(employee.date_of_joining)}</td>
      </tr>
      <tr>
        <td class="label">Aadhar Number</td>
        <td class="value">${aadhar}</td>
        <td class="label">PAN Number</td>
        <td class="value">${pan}</td>
      </tr>
      <tr>
        <td class="label">Employment Type</td>
        <td class="value">${employee.employment_type || "Not Provided"}</td>
        <td class="label">Reporting Authority</td>
        <td class="value">${reportingAuthorityName}</td>
      </tr>
      <tr>
        <td class="label">Work Location</td>
        <td class="value">${employee.work_location || "Not Provided"}</td>
        <td class="label">Working Hours</td>
        <td class="value">${employee.working_hours || "Not Provided"}</td>
      </tr>
    </table>

    <div class="section-title">Earnings & Payment Summary</div>
    <table class="summary-table">
      <thead>
        <tr>
          <th>Earnings Description</th>
          <th>Deductions Description</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div style="display: flex; justify-content: space-between;">
              <span>Basic Pay</span>
              <span class="amount-value">₹${parseFloat(basicPay).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </td>
          <td>
            <div style="display: flex; justify-content: space-between; color: #64748b;">
              <span>Taxes / PF</span>
              <span>₹0.00</span>
            </div>
          </td>
        </tr>
        <tr class="total-row">
          <td>
            <div style="display: flex; justify-content: space-between; font-weight: 600;">
              <span>Gross Salary</span>
              <span class="amount-value">₹${parseFloat(basicPay).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </td>
          <td>
            <div style="display: flex; justify-content: space-between; font-weight: 600; color: #64748b;">
              <span>Total Deductions</span>
              <span>₹0.00</span>
            </div>
          </td>
        </tr>
        <tr>
          <td colspan="2">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0;">
              <span style="font-weight: 600; text-transform: uppercase; font-size: 11px; color: #475569;">Net Salary (In Hand)</span>
              <span class="net-salary-value">₹${parseFloat(basicPay).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </td>
        </tr>
        <tr style="background-color: #f0fdf4; border-top: 1.5px solid #bbf7d0;">
          <td colspan="2">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0;">
              <div>
                <span style="font-weight: 700; font-size: 11.5px; color: #166534; text-transform: uppercase;">Amount Paid</span>
                <span style="font-size: 10px; color: #4b5563; font-weight: 400; display: block; margin-top: 2px;">Paid Through: ${paidThrough}</span>
              </div>
              <span class="paid-value">₹${parseFloat(amountPaid).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="footer-sig">
      <div class="sig-block">
        <div class="sig-image-container">
          ${signatureBase64 ? `<img src="${signatureBase64}" style="max-height: 55px; max-width: 180px; object-fit: contain;" alt="Authorized Signature" />` : ""}
        </div>
        ${!signatureBase64 ? `<div class="sig-line"></div>` : ""}
        <p class="sig-name">${ownerProfile?.name || owner.name}</p>
        <div class="sig-label">Authorized Signatory</div>
      </div>
    </div>
  </div>
</body>
</html>`;

    // Save payslip locally to public/uploads/documents/
    const filename = `payslip-${profileId}-${month}.html`;
    const docDir = path.join(process.cwd(), "public", "uploads", "documents");
    await fs.mkdir(docDir, { recursive: true });
    const filePath = path.join(docDir, filename);
    await fs.writeFile(filePath, htmlContent, "utf-8");
    const fileUrl = `/uploads/documents/${filename}`;

    // Upsert or insert document record
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

    revalidatePath("/profile");
    revalidatePath("/attendance");
    return { ok: true, message: `Salary slip for ${monthLabel} generated successfully!` };
  } catch (err: any) {
    console.error("generatePayslip exception:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
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
      })
      .eq("id", profileId);

    if (error) {
      console.error("updateStaffProfile database error:", error);
      return { error: error.message };
    }

    // Helper to upload document files
    const handleDocumentUpload = async (file: File, type: "aadhar_card" | "pan_card") => {
      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filename = `${Date.now()}-${type}-${cleanName}`;
        const docDir = path.join(process.cwd(), "public", "uploads", "documents");
        
        await fs.mkdir(docDir, { recursive: true });
        const filePath = path.join(docDir, filename);
        await fs.writeFile(filePath, buffer);
        const fileUrl = `/uploads/documents/${filename}`;

        // Upsert logic in staff_documents
        const { data: existingDoc } = await supabase
          .from("staff_documents")
          .select("id, file_url")
          .eq("profile_id", profileId)
          .eq("type", type)
          .maybeSingle();

        if (existingDoc) {
          // Delete old file
          try {
            const oldFilePath = path.join(process.cwd(), "public", existingDoc.file_url);
            await fs.unlink(oldFilePath);
          } catch (e) {
            console.warn("Could not delete old file:", e);
          }

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

    // Save file locally to public/uploads/signatures
    let fileUrl = "";
    try {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filename = `${owner.id}-sig-${Date.now()}-${cleanName}`;
      const sigDir = path.join(process.cwd(), "public", "uploads", "signatures");
      
      await fs.mkdir(sigDir, { recursive: true });
      const filePath = path.join(sigDir, filename);
      await fs.writeFile(filePath, buffer);
      fileUrl = `/uploads/signatures/${filename}`;
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
