"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useFormState } from "react-dom";
import { toast } from "sonner";
import { Confetti } from "@/components/ui/confetti";
import { 
  FileText, 
  CalendarDays, 
  Calendar, 
  Upload, 
  Trash2, 
  Check, 
  X, 
  Eye,
  EyeOff,
  MessageSquare, 
  User,
  Plus,
  DollarSign,
  Wallet
} from "lucide-react";
import { updateLeaveStatus, uploadStaffDocument, deleteStaffDocument, generatePayslip, generateBatchPayslips, updateStaffProfile, uploadOwnerSignature, savePayrollAdvance, deletePayrollAdvance, togglePayslipVisibility } from "@/app/(app)/attendance/actions-hr";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FileInput } from "@/components/ui/file-input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";

interface StaffProfile {
  id: string;
  name: string;
  email?: string | null;
  role: string;
  team?: "kitchen" | "front_desk" | "head_chef" | null;
  employee_code?: string | null;
  dob?: string | null;
  aadhar_number?: string | null;
  pan_number?: string | null;
  basic_pay?: number | null;
  paid_through?: string | null;
  personal_email?: string | null;
  phone_number?: string | null;
  address?: string | null;
  designation?: string | null;
  date_of_joining?: string | null;
  work_location?: string | null;
  working_hours?: string | null;
  employment_type?: string | null;
  reporting_authority?: string | null;
  signature_url?: string | null;
  biometric_pin?: string | null;
  biometric_name?: string | null;
}

interface LeaveRequest {
  id: string;
  profile_id: string;
  leave_type: "cl" | "sl" | "lwp";
  start_date: string;
  end_date: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  notes: string | null;
  submitted_at: string;
}

interface StaffDocument {
  id: string;
  profile_id: string;
  type: "appointment_letter" | "salary_slip" | "aadhar_card" | "pan_card";
  month: string | null;
  file_url: string;
  file_name: string;
  uploaded_at: string;
  is_visible_to_staff: boolean;
}

interface PayrollAdvance {
  id: string;
  profile_id: string;
  month: string;
  amount: number;
  notes: string | null;
  advance_date: string | null;
  created_at: string;
}

interface Props {
  staffList: StaffProfile[];
  initialLeaves: LeaveRequest[];
  initialDocuments: StaffDocument[];
  initialAdvances: PayrollAdvance[];
  ownerProfile: StaffProfile | null;
  attendanceChild: React.ReactNode;
}

function getDurationInDays(startDateStr: string, endDateStr: string): number {
  const start = new Date(startDateStr + "T00:00:00");
  const end = new Date(endDateStr + "T00:00:00");
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0;
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
  return diffDays;
}

function calculateUsedLeaves(leaves: LeaveRequest[], profileId: string) {
  let clUsed = 0;
  let slUsed = 0;
  let lwpUsed = 0;
  const now = new Date();
  const currentYear = now.getFullYear().toString();
  const currentMonth = `${currentYear}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  let clThisMonth = 0;
  let slThisMonth = 0;

  leaves.forEach((leave) => {
    if (leave.profile_id === profileId && leave.status === "approved") {
      if (leave.start_date.startsWith(currentYear)) {
        const days = getDurationInDays(leave.start_date, leave.end_date);
        if (leave.leave_type === "cl") { clUsed += days; }
        if (leave.leave_type === "sl") { slUsed += days; }
        if (leave.leave_type === "lwp") { lwpUsed += days; }
        if (leave.start_date.startsWith(currentMonth)) {
          if (leave.leave_type === "cl") clThisMonth += days;
          if (leave.leave_type === "sl") slThisMonth += days;
        }
      }
    }
  });

  return {
    clUsed,
    slUsed,
    lwpUsed,
    clThisMonth,
    slThisMonth,
    clRemaining: Math.max(0, 48 - clUsed),
    slRemaining: Math.max(0, 6 - slUsed),
  };
}

export function AttendanceHRClient({ staffList, initialLeaves, initialDocuments, initialAdvances, ownerProfile, attendanceChild }: Props) {
  const [activeTab, setActiveTab] = useState<"attendance" | "leaves" | "documents" | "people" | "payroll">("people");
  const [reviewingLeaveId, setReviewingLeaveId] = useState<string | null>(null);
  const [managerNotes, setManagerNotes] = useState<string>("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileFormRef = useRef<HTMLFormElement>(null);
  const [docType, setDocType] = useState<"appointment_letter" | "salary_slip" | "aadhar_card" | "pan_card">("appointment_letter");

  // Document generating sub-tab state
  const [docSubTab, setDocSubTab] = useState<"upload" | "generate" | "signature">("upload");

  // States for generating payslip
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [dob, setDob] = useState("");
  const [aadhar, setAadhar] = useState("");
  const [pan, setPan] = useState("");
  const [basicPay, setBasicPay] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [paidThrough, setPaidThrough] = useState("");
  const [isBatchMode, setIsBatchMode] = useState(false);

  const payslipFormRef = useRef<HTMLFormElement>(null);

  // States for updating staff profile (People Tab)
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [profileState, profileFormAction] = useFormState(updateStaffProfile, {});
  const profileFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (profileState.error) {
      toast.error(profileState.error);
    } else if (profileState.ok) {
      toast.success(profileState.message || "Profile updated successfully!");
      setShowConfetti(true);
      setEditingStaffId(null);
      window.location.reload();
    }
  }, [profileState]);

  // Filter staff to exclude owners
  const activeStaffList = staffList.filter((s) => s.role !== "owner");

  const selectedStaff = activeStaffList.find((s) => s.id === selectedStaffId);

  // Pre-fill payslip form details when staff changes
  useEffect(() => {
    if (selectedStaff) {
      setEmployeeCode(selectedStaff.employee_code || "");
      setDob(selectedStaff.dob || "");
      setAadhar(selectedStaff.aadhar_number || "");
      setPan(selectedStaff.pan_number || "");
      setBasicPay(selectedStaff.basic_pay ? String(selectedStaff.basic_pay) : "");
      setAmountPaid(selectedStaff.basic_pay ? String(selectedStaff.basic_pay) : "");
      setPaidThrough(selectedStaff.paid_through || "");
    } else {
      setEmployeeCode("");
      setDob("");
      setAadhar("");
      setPan("");
      setBasicPay("");
      setAmountPaid("");
      setPaidThrough("");
    }
  }, [selectedStaffId, selectedStaff]);

  // useFormState for generatePayslip
  const [payslipState, payslipFormAction] = useFormState(generatePayslip, {});

  useEffect(() => {
    if (payslipState.error) {
      toast.error(payslipState.error);
    } else if (payslipState.ok) {
      toast.success(payslipState.message || "Payslip generated successfully!");
      setShowConfetti(true);
      payslipFormRef.current?.reset();
      setSelectedStaffId("");
      window.location.reload();
    }
  }, [payslipState]);

  // useFormState for generateBatchPayslips
  const [batchState, batchFormAction] = useFormState(generateBatchPayslips, {});

  useEffect(() => {
    if (batchState.error) {
      toast.error(batchState.error);
    } else if (batchState.ok) {
      toast.success(batchState.message || "Batch payslips generated successfully!");
      setShowConfetti(true);
      window.location.reload();
    }
  }, [batchState]);

  // Payroll Advance state
  const [advanceFilterMonth, setAdvanceFilterMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const advanceFormRef = useRef<HTMLFormElement>(null);
  const [advanceState, advanceFormAction] = useFormState(savePayrollAdvance, {});
  const [deletingAdvanceId, setDeletingAdvanceId] = useState<string | null>(null);
  const [togglingDocId, setTogglingDocId] = useState<string | null>(null);

  useEffect(() => {
    if (advanceState.error) {
      toast.error(advanceState.error);
    } else if (advanceState.ok) {
      toast.success(advanceState.message || "Advance saved!");
      advanceFormRef.current?.reset();
      window.location.reload();
    }
  }, [advanceState]);

  // Signature upload state
  const sigFormRef = useRef<HTMLFormElement>(null);
  const [sigState, sigFormAction] = useFormState(uploadOwnerSignature, {});
  useEffect(() => {
    if (sigState.error) {
      toast.error(sigState.error);
    } else if (sigState.ok) {
      toast.success(sigState.message || "Signature uploaded!");
      setShowConfetti(true);
      sigFormRef.current?.reset();
      window.location.reload();
    }
  }, [sigState]);
  
  // Name mapping helper
  const staffNameMap = staffList.reduce((acc, s) => {
    acc[s.id] = s.name;
    return acc;
  }, {} as Record<string, string>);

  const handleUpdateStatus = (leaveId: string, status: "approved" | "rejected") => {
    startTransition(async () => {
      const res = await updateLeaveStatus(leaveId, status, managerNotes);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.message || `Leave ${status} successfully.`);
        setReviewingLeaveId(null);
        setManagerNotes("");
        window.location.reload();
      }
    });
  };

  const handleUploadDoc = async (formData: FormData) => {
    startTransition(async () => {
      const res = await uploadStaffDocument({}, formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.message || "Document uploaded!");
        fileFormRef.current?.reset();
        setDocType("appointment_letter");
        window.location.reload();
      }
    });
  };

  const handleDeleteDoc = (docId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const res = await deleteStaffDocument(docId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.message || "Document deleted.");
        window.location.reload();
      }
    });
  };

  const formatMonth = (monthStr: string | null) => {
    if (!monthStr) return "";
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  };

  // Group leaves
  const pendingLeaves = initialLeaves.filter((l) => l.status === "pending");
  const historyLeaves = initialLeaves.filter((l) => l.status !== "pending").sort((a, b) => {
    return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
  });

  return (
    <div className="space-y-4">
      <Confetti active={showConfetti} />
      {/* Top Title */}
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div>
          <h2 className="text-base font-bold text-content-primary flex items-center gap-2">
            <CalendarDays className="size-5 text-warm" />
            Staff Attendance & HR Portal
          </h2>
          <p className="text-xs text-content-secondary mt-0.5 hidden sm:block">
            Manage staff biometric attendance, leaves, and core HR documents
          </p>
        </div>
      </div>

      {/* Scrollable Pill Tabs — all screen sizes */}
      <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 border-b border-border/40 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("people")}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
            activeTab === "people"
              ? "bg-fire/15 text-warm"
              : "text-content-secondary hover:bg-bg-elevated"
          )}
        >
          <User className="size-4" />
          People
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("attendance")}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
            activeTab === "attendance"
              ? "bg-fire/15 text-warm"
              : "text-content-secondary hover:bg-bg-elevated"
          )}
        >
          <Calendar className="size-4" />
          Attendance
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("leaves")}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
            activeTab === "leaves"
              ? "bg-fire/15 text-warm"
              : "text-content-secondary hover:bg-bg-elevated"
          )}
        >
          <CalendarDays className="size-4" />
          Leaves
          {pendingLeaves.length > 0 && (
            <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-bold text-white animate-pulse">
              {pendingLeaves.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("payroll")}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
            activeTab === "payroll"
              ? "bg-fire/15 text-warm"
              : "text-content-secondary hover:bg-bg-elevated"
          )}
        >
          <DollarSign className="size-4" />
          Payroll
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("documents")}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
            activeTab === "documents"
              ? "bg-fire/15 text-warm"
              : "text-content-secondary hover:bg-bg-elevated"
          )}
        >
          <FileText className="size-4" />
          Documents
        </button>
      </div>



      {/* Content Panels */}
      <div className="space-y-4">
        {/* 1. ATTENDANCE CLIENT */}
        {activeTab === "attendance" && (
          <div className="animate-fade-in">
            {attendanceChild}
          </div>
        )}

        {/* PAYROLL TAB */}
        {activeTab === "payroll" && (
          <div className="animate-fade-in space-y-6">

            {/* ── PAYSLIP GENERATION ──────────────────────── */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-content-secondary flex items-center gap-1.5">
                <FileText className="size-3.5" />
                Generate Payslips
              </h3>

              {/* Mode Toggle */}
              <div className="flex rounded-md bg-white/5 p-0.5 border border-border/20">
                <button
                  type="button"
                  className={cn("flex-1 py-1.5 rounded text-center text-xs transition-all", !isBatchMode ? "bg-fire text-white font-semibold" : "text-content-secondary hover:text-content-primary")}
                  onClick={() => setIsBatchMode(false)} disabled={pending}
                >Single Staff</button>
                <button
                  type="button"
                  className={cn("flex-1 py-1.5 rounded text-center text-xs transition-all", isBatchMode ? "bg-fire text-white font-semibold" : "text-content-secondary hover:text-content-primary")}
                  onClick={() => setIsBatchMode(true)} disabled={pending}
                >Batch Generate All</button>
              </div>

              {!isBatchMode ? (
                <form ref={payslipFormRef} action={payslipFormAction} className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <Label htmlFor="pay-profile2">Staff Member</Label>
                    <Select id="pay-profile2" name="profileId" required value={selectedStaffId} onChange={(e) => setSelectedStaffId(e.target.value)}>
                      <option value="">-- Select Staff --</option>
                      {activeStaffList.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="pay-month2">Month</Label>
                      <Input id="pay-month2" name="month" type="month" required style={{ colorScheme: "dark" }} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="pay-code2">Employee Code</Label>
                      <Input id="pay-code2" name="employeeCode" placeholder="BC001" required value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="pay-dob2">Date of Birth</Label>
                      <Input id="pay-dob2" name="dob" type="date" style={{ colorScheme: "dark" }} value={dob} onChange={(e) => setDob(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="pay-pan2">PAN Number</Label>
                      <Input id="pay-pan2" name="pan" placeholder="ABCDE1234F" required value={pan} onChange={(e) => setPan(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="pay-aadhar2">Aadhar Number</Label>
                    <Input id="pay-aadhar2" name="aadhar" placeholder="1234 5678 9012" required value={aadhar} onChange={(e) => setAadhar(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="pay-basic2">Basic Salary (₹)</Label>
                      <Input id="pay-basic2" name="basicPay" type="number" step="1" placeholder="15000" required value={basicPay} onChange={(e) => { setBasicPay(e.target.value); setAmountPaid(e.target.value); }} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="pay-amount2">Amount Paid (₹)</Label>
                      <Input id="pay-amount2" name="amountPaid" type="number" step="1" placeholder="15000" required value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="pay-through2">Paid Through</Label>
                    <Input id="pay-through2" name="paidThrough" placeholder="Bank Transfer / UPI / Cash" required value={paidThrough} onChange={(e) => setPaidThrough(e.target.value)} />
                  </div>
                  <SubmitButton pendingText="Generating..." className="w-full mt-1">
                    <Plus className="size-4" /> Generate Payslip
                  </SubmitButton>
                </form>
              ) : (
                <form action={batchFormAction} className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <Label htmlFor="batch-month2">Select Month</Label>
                    <Input id="batch-month2" name="month" type="month" required disabled={pending} style={{ colorScheme: "dark" }} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="batch-through2">Paid Through</Label>
                    <Input id="batch-through2" name="paidThrough" placeholder="Bank Transfer / UPI / Cash" required disabled={pending} />
                  </div>
                  <div className="rounded-lg border border-border/30 bg-white/[0.015] p-3 space-y-2">
                    <h4 className="font-semibold text-content-primary text-[11px] mb-1">Staff Included in Batch:</h4>
                    <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                      {activeStaffList.map((s) => {
                        const isMissing = !s.employee_code || !s.basic_pay || !s.aadhar_number || !s.pan_number;
                        return (
                          <div key={s.id} className="flex items-center justify-between text-[11px] py-1 border-b border-border/10 last:border-0">
                            <span className="font-medium text-content-secondary">{s.name}</span>
                            {isMissing ? <span className="text-[10px] text-red-400 italic">Missing Info</span> : <span className="text-[10px] text-green-400">Ready · ₹{s.basic_pay?.toLocaleString("en-IN")}</span>}
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-content-secondary italic mt-1 border-t border-border/10 pt-2">Owners excluded automatically.</p>
                  </div>
                  <SubmitButton pendingText="Generating Batch..." className="w-full mt-1">
                    <Plus className="size-4" /> Generate Slips for All Staff
                  </SubmitButton>
                </form>
              )}
            </div>

            {/* ── ADVANCE MANAGEMENT ──────────────────────── */}
            <div className="space-y-3 pt-4 border-t border-border/40">
              <h3 className="text-xs font-bold uppercase tracking-wider text-content-secondary flex items-center gap-1.5">
                <Wallet className="size-3.5" />
                Staff Advances
              </h3>

              {/* Add Advance Form */}
              <form ref={advanceFormRef} action={advanceFormAction} className="rounded-lg border border-border/30 bg-white/[0.015] p-3 space-y-3 text-xs">
                <p className="text-[11px] font-semibold text-content-primary">Record Advance Taken</p>
                <div className="space-y-1">
                  <Label htmlFor="adv-staff">Staff Member</Label>
                  <Select id="adv-staff" name="profileId" required>
                    <option value="">-- Select Staff --</option>
                    {activeStaffList.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="adv-month">Payroll Month</Label>
                    <Input id="adv-month" name="month" type="month" required style={{ colorScheme: "dark" }} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="adv-amount">Amount (₹)</Label>
                    <Input id="adv-amount" name="amount" type="number" step="1" min="1" placeholder="5000" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="adv-date">Date Taken (Optional)</Label>
                    <Input id="adv-date" name="advanceDate" type="date" style={{ colorScheme: "dark" }} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="adv-notes">Notes (Optional)</Label>
                    <Input id="adv-notes" name="notes" placeholder="e.g. Emergency advance" />
                  </div>
                </div>
                <SubmitButton pendingText="Saving..." className="w-full">
                  <Plus className="size-3.5" /> Record Advance
                </SubmitButton>
              </form>

              {/* Filter by month */}
              <div className="flex items-center gap-2">
                <Label htmlFor="adv-filter" className="text-[11px] shrink-0">Filter by Month:</Label>
                <Input
                  id="adv-filter"
                  type="month"
                  value={advanceFilterMonth}
                  onChange={(e) => setAdvanceFilterMonth(e.target.value)}
                  style={{ colorScheme: "dark" }}
                  className="text-xs py-1 h-7 max-w-[160px]"
                />
              </div>

              {/* Advances List */}
              {(() => {
                const filtered = initialAdvances.filter((a) => a.month === advanceFilterMonth);
                if (filtered.length === 0) {
                  return (
                    <Card className="p-4 text-center text-xs text-content-secondary bg-white/[0.01]">
                      No advances recorded for {advanceFilterMonth || "this month"}.
                    </Card>
                  );
                }
                // Group by staff
                const byStaff: Record<string, typeof filtered> = {};
                filtered.forEach((a) => {
                  if (!byStaff[a.profile_id]) byStaff[a.profile_id] = [];
                  byStaff[a.profile_id].push(a);
                });
                return (
                  <div className="space-y-2">
                    {Object.entries(byStaff).map(([pid, advs]) => {
                      const staffName = staffNameMap[pid] || "Unknown";
                      const total = advs.reduce((s, a) => s + Number(a.amount), 0);
                      return (
                        <Card key={pid} className="p-3 space-y-2 bg-white/[0.01] border-border/30 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-content-primary flex items-center gap-1.5">
                              <User className="size-3.5 text-warm" />{staffName}
                            </span>
                            <span className="font-bold text-orange-400">Total: ₹{total.toLocaleString("en-IN")}</span>
                          </div>
                          <div className="space-y-1.5">
                            {advs.map((adv) => (
                              <div key={adv.id} className="flex items-center justify-between py-1 border-b border-border/10 last:border-0 gap-2">
                                <div className="flex-1 min-w-0">
                                  <span className="font-medium text-content-primary">₹{Number(adv.amount).toLocaleString("en-IN")}</span>
                                  {adv.notes && <span className="ml-1.5 text-content-secondary">· {adv.notes}</span>}
                                  {adv.advance_date && (
                                    <span className="ml-1.5 text-[10px] text-content-secondary">
                                      ({new Date(adv.advance_date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })})
                                    </span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  disabled={pending || deletingAdvanceId === adv.id}
                                  onClick={() => {
                                    if (!confirm(`Delete this ₹${adv.amount} advance for ${staffName}?`)) return;
                                    setDeletingAdvanceId(adv.id);
                                    startTransition(async () => {
                                      const res = await deletePayrollAdvance(adv.id);
                                      setDeletingAdvanceId(null);
                                      if (res.error) toast.error(res.error);
                                      else { toast.success("Advance deleted."); window.location.reload(); }
                                    });
                                  }}
                                  className="shrink-0 text-red-400 hover:text-red-300 transition-colors p-1 rounded"
                                  title="Delete advance"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* ── GENERATED PAYSLIPS (with visibility toggle) ── */}
            <div className="space-y-3 pt-4 border-t border-border/40">
              <h3 className="text-xs font-bold uppercase tracking-wider text-content-secondary flex items-center gap-1.5">
                <FileText className="size-3.5" />
                Generated Payslips
              </h3>
              <p className="text-[11px] text-content-secondary">Toggle the eye icon to make a payslip visible or hidden for staff on their profile page.</p>
              {(() => {
                const payslips = initialDocuments.filter((d) => d.type === "salary_slip");
                if (payslips.length === 0) {
                  return (
                    <Card className="p-4 text-center text-xs text-content-secondary bg-white/[0.01]">
                      No payslips generated yet.
                    </Card>
                  );
                }
                return (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {payslips.map((doc) => {
                      const staffName = staffNameMap[doc.profile_id] || "Unknown";
                      const isVisible = doc.is_visible_to_staff;
                      const isToggling = togglingDocId === doc.id;
                      return (
                        <Card key={doc.id} className="p-3 flex items-center justify-between gap-2 bg-white/[0.01] border-border/30 text-xs">
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-content-primary">{staffName}</span>
                            <span className="mx-1.5 text-content-secondary">·</span>
                            <span className="text-content-secondary">{formatMonth(doc.month)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isVisible ? (
                              <Badge variant="success" className="text-[9px] uppercase py-0 px-1.5">Visible</Badge>
                            ) : (
                              <Badge variant="default" className="text-[9px] uppercase py-0 px-1.5 bg-bg-elevated text-content-secondary border border-border/30">Hidden</Badge>
                            )}
                            <button
                              type="button"
                              disabled={pending || isToggling}
                              onClick={() => {
                                setTogglingDocId(doc.id);
                                startTransition(async () => {
                                  const res = await togglePayslipVisibility(doc.id, !isVisible);
                                  setTogglingDocId(null);
                                  if (res.error) toast.error(res.error);
                                  else { toast.success(isVisible ? "Payslip hidden from staff." : "Payslip is now visible to staff."); window.location.reload(); }
                                });
                              }}
                              className={cn(
                                "p-1 rounded transition-colors",
                                isVisible ? "text-green-400 hover:text-green-300" : "text-content-secondary hover:text-content-primary"
                              )}
                              title={isVisible ? "Hide from staff" : "Make visible to staff"}
                            >
                              {isVisible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                            </button>
                            <a
                              href={doc.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded text-content-secondary hover:text-content-primary transition-colors"
                              title="View payslip"
                            >
                              <FileText className="size-3.5" />
                            </a>
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => handleDeleteDoc(doc.id, doc.file_name)}
                              className="p-1 rounded text-red-400 hover:text-red-300 transition-colors"
                              title="Delete payslip"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* ── SIGNATURE UPLOAD ──────────────────────────── */}
            <div className="space-y-3 pt-4 border-t border-border/40">
              <h3 className="text-xs font-bold uppercase tracking-wider text-content-secondary">Authorized Signature</h3>
              <form ref={sigFormRef} action={sigFormAction} className="space-y-3 text-xs">
                <div className="space-y-1.5">
                  <Label htmlFor="sig-file2">Upload Authorized Signature</Label>
                  <FileInput id="sig-file2" name="signatureFile" required accept="image/*" />
                  <p className="text-[10px] text-content-secondary font-mono">Accepts JPG, PNG, WEBP (transparent background recommended)</p>
                </div>
                {ownerProfile?.signature_url && (
                  <div className="flex items-center gap-2 p-2 rounded-lg border border-border/30 bg-white/[0.015]">
                    <img src={ownerProfile.signature_url} alt="Current Signature" className="h-8 object-contain max-w-[120px]" />
                    <span className="text-[10px] text-content-secondary">Current signature on file</span>
                  </div>
                )}
                <SubmitButton pendingText="Uploading..." className="w-full">
                  <Upload className="size-4" /> Update Signature
                </SubmitButton>
              </form>
            </div>

          </div>
        )}

        {/* 2. LEAVE REQUESTS */}
        {activeTab === "leaves" && (

          <div className="animate-fade-in grid gap-5 lg:grid-cols-3">
            {/* Pending leave requests */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-content-secondary flex items-center gap-1.5">
                Pending Requests ({pendingLeaves.length})
              </h3>

              {pendingLeaves.length === 0 ? (
                <Card className="p-6 text-center text-xs text-content-secondary bg-white/[0.01]">
                  No pending leave requests.
                </Card>
              ) : (
                <div className="space-y-3">
                  {pendingLeaves.map((leave) => {
                    const staffName = staffNameMap[leave.profile_id] || "Unknown Staff";
                    const from = new Date(leave.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
                    const to = new Date(leave.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
                    const isReviewing = reviewingLeaveId === leave.id;

                    return (
                      <Card key={leave.id} className="p-4 space-y-3 bg-white/[0.01] border-border/30">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-sm font-bold text-content-primary flex items-center gap-1.5">
                              <User className="size-4 text-warm" />
                              {staffName}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="default" className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0 bg-bg-elevated text-content-primary border border-border/30">
                                {leave.leave_type === "cl" ? "Weekly Leave / CL" : leave.leave_type === "sl" ? "Sick Leave (SL)" : "Leave Without Pay (LWP)"}
                              </Badge>
                            </div>
                            <p className="text-xs text-content-secondary mt-1.5">
                              Requested: <span className="font-semibold text-content-primary">{from}</span> to <span className="font-semibold text-content-primary">{to}</span>
                            </p>
                          </div>
                          
                          {!isReviewing && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setReviewingLeaveId(leave.id);
                                setManagerNotes("");
                              }}
                            >
                              Review
                            </Button>
                          )}
                        </div>

                        <div className="text-xs bg-bg-elevated/20 p-2.5 rounded-lg border border-border/40 text-content-secondary">
                          <span className="font-bold text-content-primary">Reason: </span>
                          {leave.reason}
                        </div>

                        {isReviewing && (
                          <div className="pt-3 border-t border-border/40 space-y-3 animate-fade-in">
                            <div className="space-y-1.5">
                              <Label htmlFor="mgr-notes" className="text-xs">Manager Notes / Remarks (Optional)</Label>
                              <Input
                                id="mgr-notes"
                                placeholder="e.g. Approved. Coverage arranged."
                                value={managerNotes}
                                onChange={(e) => setManagerNotes(e.target.value)}
                                disabled={pending}
                              />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setReviewingLeaveId(null)}
                                disabled={pending}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                className="gap-1"
                                onClick={() => handleUpdateStatus(leave.id, "rejected")}
                                disabled={pending}
                              >
                                <X className="size-3.5" />
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                variant="success"
                                className="gap-1 text-black bg-success hover:bg-success/90"
                                onClick={() => handleUpdateStatus(leave.id, "approved")}
                                disabled={pending}
                              >
                                <Check className="size-3.5" />
                                Approve
                              </Button>
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Leave History */}
            <div className="lg:col-span-1 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-content-secondary flex items-center gap-1.5">
                Leave History
              </h3>

              {historyLeaves.length === 0 ? (
                <Card className="p-6 text-center text-xs text-content-secondary bg-white/[0.01]">
                  No past leave history.
                </Card>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {historyLeaves.map((leave) => {
                    const staffName = staffNameMap[leave.profile_id] || "Unknown Staff";
                    const from = new Date(leave.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
                    const to = new Date(leave.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
                    
                    return (
                      <Card key={leave.id} className="p-3.5 space-y-2.5 bg-white/[0.01] border-border/20 text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-content-primary">{staffName}</span>
                          <Badge variant={leave.status === "approved" ? "success" : "danger"} className="text-[9px] uppercase font-bold py-0">
                            {leave.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="default" className="text-[8px] font-bold uppercase tracking-wider px-1 py-0 bg-bg-elevated text-content-primary border border-border/30">
                            {leave.leave_type === "cl" ? "WL/CL" : leave.leave_type === "sl" ? "SL" : "LWP"}
                          </Badge>
                          <span className="text-content-secondary text-[10px]">
                            {from} - {to}
                          </span>
                        </div>
                        <p className="text-content-secondary leading-relaxed line-clamp-2" title={leave.reason}>
                          <span className="font-semibold">Reason:</span> {leave.reason}
                        </p>
                        {leave.notes && (
                          <p className="text-content-secondary/80 bg-bg-elevated/40 border border-border/40 p-1.5 rounded text-[11px]">
                            <span className="font-semibold text-content-primary">Notes:</span> {leave.notes}
                          </p>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Staff Leave Balances List */}
            <div className="lg:col-span-3">
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-content-secondary">
                  Leave Balances · {new Date().getFullYear()}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {activeStaffList.map((staff) => {
                    const bal = calculateUsedLeaves(initialLeaves, staff.id);
                    return (
                      <Card key={staff.id} className="p-4 space-y-3 bg-white/[0.01] border-border/30">
                        <div className="flex items-center gap-2 border-b border-border/30 pb-2.5">
                          <User className="size-3.5 text-warm shrink-0" />
                          <span className="text-sm font-bold text-content-primary">{staff.name}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-content-secondary">WL/CL</p>
                            <p className="font-mono text-lg font-bold text-warm">{bal.clRemaining}</p>
                            <p className="text-[10px] text-content-secondary">remaining</p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-content-secondary">Used</p>
                            <p className="font-mono text-lg font-bold text-content-primary">{bal.clUsed}</p>
                            <p className="text-[10px] text-content-secondary">this year</p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-content-secondary">This Month</p>
                            <p className="font-mono text-lg font-bold text-content-primary">{bal.clThisMonth}</p>
                            <p className="text-[10px] text-content-secondary">WL/CL days</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 border-t border-border/20 pt-2.5">
                          <div className="flex items-center justify-between rounded-lg bg-bg-elevated/40 px-3 py-2">
                            <span className="text-xs text-content-secondary">SL used</span>
                            <span className="font-mono text-sm font-bold text-content-primary">{bal.slUsed} <span className="text-[10px] font-normal text-content-secondary">/ 6</span></span>
                          </div>
                          <div className="flex items-center justify-between rounded-lg bg-bg-elevated/40 px-3 py-2">
                            <span className="text-xs text-content-secondary">LWP</span>
                            <span className="font-mono text-sm font-bold text-danger">{bal.lwpUsed} <span className="text-[10px] font-normal text-content-secondary">days</span></span>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* 3. STAFF DOCUMENTS */}
        {activeTab === "documents" && (
          <div className="animate-fade-in grid gap-5 lg:grid-cols-3">
            {/* Upload Document Form */}
            <Card className="p-5 lg:col-span-1 h-fit space-y-4 bg-white/[0.02]">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <h3 className="text-sm font-bold text-content-primary">Staff Documents</h3>
                <div className="flex gap-1 bg-bg-elevated p-0.5 rounded-lg border border-border/60">
                  <button
                    type="button"
                    onClick={() => setDocSubTab("upload")}
                    className={cn(
                      "px-2 py-1 text-[10px] font-bold rounded transition-colors",
                      docSubTab === "upload" ? "bg-white text-black" : "text-content-secondary hover:text-content-primary"
                    )}
                  >
                    Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocSubTab("generate")}
                    className={cn(
                      "px-2 py-1 text-[10px] font-bold rounded transition-colors",
                      docSubTab === "generate" ? "bg-white text-black" : "text-content-secondary hover:text-content-primary"
                    )}
                  >
                    Generate Payslip
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocSubTab("signature")}
                    className={cn(
                      "px-2 py-1 text-[10px] font-bold rounded transition-colors",
                      docSubTab === "signature" ? "bg-white text-black" : "text-content-secondary hover:text-content-primary"
                    )}
                  >
                    Signature
                  </button>
                </div>
              </div>

              {docSubTab === "upload" && (
                <form ref={fileFormRef} action={handleUploadDoc} className="space-y-3.5 animate-fade-in">
                  <div className="space-y-1.5">
                    <Label htmlFor="doc-profile">Staff Member</Label>
                    <Select id="doc-profile" name="profileId" required disabled={pending}>
                      <option value="">-- Select Staff --</option>
                      {activeStaffList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="doc-type">Document Type</Label>
                    <Select 
                      id="doc-type" 
                      name="type" 
                      value={docType} 
                      onChange={(e) => setDocType(e.target.value as any)} 
                      required 
                      disabled={pending}
                    >
                      <option value="appointment_letter">Appointment Letter</option>
                      <option value="salary_slip">Salary Slip</option>
                      <option value="aadhar_card">Aadhar Card</option>
                      <option value="pan_card">PAN Card</option>
                    </Select>
                  </div>

                  {docType === "salary_slip" && (
                    <div className="space-y-1.5 animate-fade-in">
                      <Label htmlFor="doc-month">Select Month</Label>
                      <Input id="doc-month" name="month" type="month" required disabled={pending} />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="doc-file">Document File</Label>
                    <FileInput id="doc-file" name="file" required disabled={pending} accept=".pdf,image/*,.doc,.docx" />
                    <p className="text-[10px] text-content-secondary font-mono">Accepts PDF, JPG, PNG, DOCX</p>
                  </div>

                  <SubmitButton pendingText="Uploading..." className="w-full">
                    <Upload className="size-4" />
                    Upload Document
                  </SubmitButton>
                </form>
              )}

              {docSubTab === "generate" && (
                <div className="space-y-3 animate-fade-in text-xs">
                  {/* Mode Selector Toggle */}
                  <div className="flex rounded-md bg-white/5 p-0.5 border border-border/20 mb-2">
                    <button
                      type="button"
                      className={cn(
                        "flex-1 py-1 rounded text-center transition-all",
                        !isBatchMode ? "bg-fire text-white font-semibold" : "text-content-secondary hover:text-content-primary"
                      )}
                      onClick={() => setIsBatchMode(false)}
                      disabled={pending}
                    >
                      Single Staff
                    </button>
                    <button
                      type="button"
                      className={cn(
                        "flex-1 py-1 rounded text-center transition-all",
                        isBatchMode ? "bg-fire text-white font-semibold" : "text-content-secondary hover:text-content-primary"
                      )}
                      onClick={() => setIsBatchMode(true)}
                      disabled={pending}
                    >
                      Batch Generate
                    </button>
                  </div>

                  {!isBatchMode ? (
                    <form ref={payslipFormRef} action={payslipFormAction} className="space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor="pay-profile">Staff Member</Label>
                        <Select 
                          id="pay-profile" 
                          name="profileId" 
                          required 
                          value={selectedStaffId}
                          onChange={(e) => setSelectedStaffId(e.target.value)}
                        >
                          <option value="">-- Select Staff --</option>
                          {activeStaffList.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor="pay-month">Select Month</Label>
                          <Input id="pay-month" name="month" type="month" required />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="pay-code">Employee Code</Label>
                          <Input 
                            id="pay-code" 
                            name="employeeCode" 
                            placeholder="e.g. BC001" 
                            required 
                            value={employeeCode}
                            onChange={(e) => setEmployeeCode(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor="pay-dob">Date of Birth</Label>
                          <Input 
                            id="pay-dob" 
                            name="dob" 
                            type="date" 
                            required 
                            style={{ colorScheme: "dark" }}
                            value={dob}
                            onChange={(e) => setDob(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="pay-pan">PAN Number</Label>
                          <Input 
                            id="pay-pan" 
                            name="pan" 
                            placeholder="ABCDE1234F" 
                            required 
                            value={pan}
                            onChange={(e) => setPan(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="pay-aadhar">Aadhar Number</Label>
                        <Input 
                          id="pay-aadhar" 
                          name="aadhar" 
                          placeholder="1234 5678 9012" 
                          required 
                          value={aadhar}
                          onChange={(e) => setAadhar(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor="pay-basic">Basic Salary (₹)</Label>
                          <Input 
                            id="pay-basic" 
                            name="basicPay" 
                            type="number" 
                            step="0.01" 
                            placeholder="15000" 
                            required 
                            value={basicPay}
                            onChange={(e) => {
                              setBasicPay(e.target.value);
                              setAmountPaid(e.target.value);
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="pay-amount">Amount Paid (₹)</Label>
                          <Input 
                            id="pay-amount" 
                            name="amountPaid" 
                            type="number" 
                            step="0.01" 
                            placeholder="15000" 
                            required 
                            value={amountPaid}
                            onChange={(e) => setAmountPaid(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="pay-through">Paid Through</Label>
                        <Input 
                          id="pay-through" 
                          name="paidThrough" 
                          placeholder="e.g. Bank Transfer / UPI / Cash" 
                          required 
                          value={paidThrough}
                          onChange={(e) => setPaidThrough(e.target.value)}
                        />
                      </div>

                      <SubmitButton pendingText="Generating..." className="w-full mt-2">
                        <Plus className="size-4" />
                        Generate Payslip
                      </SubmitButton>
                    </form>
                  ) : (
                    <form action={batchFormAction} className="space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor="batch-month">Select Month</Label>
                        <Input id="batch-month" name="month" type="month" required disabled={pending} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="batch-through">Paid Through</Label>
                        <Input 
                          id="batch-through" 
                          name="paidThrough" 
                          placeholder="e.g. Bank Transfer / UPI / Cash" 
                          required 
                          disabled={pending}
                        />
                      </div>
                      
                      {/* Active Staff List Preview */}
                      <div className="rounded-lg border border-border/30 bg-white/[0.015] p-3 space-y-2">
                        <h4 className="font-semibold text-content-primary mb-1">Staff Included in Batch:</h4>
                        <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                          {activeStaffList
                            .map((s) => {
                              const isMissing = !s.employee_code || !s.basic_pay || !s.aadhar_number || !s.pan_number;
                              return (
                                <div key={s.id} className="flex items-center justify-between text-[11px] py-1 border-b border-border/10 last:border-0">
                                  <span className="font-medium text-content-secondary">{s.name}</span>
                                  {isMissing ? (
                                    <span className="text-[10px] text-red-400 italic">Missing Profile Info</span>
                                  ) : (
                                    <span className="text-[10px] text-green-400">Ready (₹{s.basic_pay})</span>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                        <p className="text-[10px] text-content-secondary italic mt-1 border-t border-border/10 pt-2">
                          * Owners are automatically excluded. Make sure all staff show "Ready" before generating.
                        </p>
                      </div>

                      <SubmitButton pendingText="Generating Batch..." className="w-full mt-2">
                        <Plus className="size-4" />
                        Generate Slips for All Staff
                      </SubmitButton>
                    </form>
                  )}
                </div>
              )}

              {docSubTab === "signature" && (
                <form ref={sigFormRef} action={sigFormAction} className="space-y-3.5 animate-fade-in text-xs">
                  <div className="space-y-1.5">
                    <Label htmlFor="sig-file">Upload Authorized Signature</Label>
                    <FileInput id="sig-file" name="signatureFile" required accept="image/*" />
                    <p className="text-[10px] text-content-secondary font-mono">Accepts JPG, PNG, WEBP (transparent background recommended)</p>
                  </div>
                  
                  {ownerProfile?.signature_url && (
                    <div className="space-y-1.5 bg-bg-elevated/40 border border-border/40 p-2.5 rounded-lg">
                      <p className="text-[10px] font-semibold text-content-secondary uppercase tracking-wider">Current Signature</p>
                      <div className="bg-white p-2 rounded border border-border/40 inline-block">
                        <img src={ownerProfile.signature_url} className="max-h-12 object-contain" alt="Current Signature" />
                      </div>
                    </div>
                  )}

                  <SubmitButton pendingText="Uploading..." className="w-full">
                    <Upload className="size-4" />
                    Upload Signature
                  </SubmitButton>
                </form>
              )}
            </Card>

            {/* Uploaded Documents List */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-content-secondary flex items-center gap-1.5">
                Uploaded Staff Documents ({initialDocuments.length})
              </h3>

              {initialDocuments.length === 0 ? (
                <Card className="p-6 text-center text-xs text-content-secondary bg-white/[0.01]">
                  No documents have been uploaded yet.
                </Card>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                  {activeStaffList.map((staff) => {
                    const staffDocs = initialDocuments.filter((d) => d.profile_id === staff.id);
                    if (staffDocs.length === 0) return null;

                    return (
                      <Card key={staff.id} className="p-4 bg-white/[0.01] border-border/30 space-y-3">
                        <h4 className="text-xs font-bold text-content-primary border-b border-border/40 pb-1.5">
                          {staff.name}
                        </h4>
                        
                        <div className="divide-y divide-border/40">
                          {staffDocs.map((doc) => (
                            <div key={doc.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                              <div className="min-w-0">
                                <p className="font-semibold text-content-primary flex items-center gap-1.5">
                                  <Badge 
                                    variant={
                                      doc.type === "appointment_letter" ? "default" :
                                      doc.type === "aadhar_card" ? "success" :
                                      doc.type === "pan_card" ? "fire" : "fire"
                                    } 
                                    className="text-[9px] py-0 px-1 font-bold uppercase"
                                  >
                                    {doc.type === "appointment_letter" ? "Letter" : 
                                     doc.type === "salary_slip" ? "Salary" :
                                     doc.type === "aadhar_card" ? "Aadhar" : "PAN"}
                                  </Badge>
                                  {doc.type === "salary_slip" ? formatMonth(doc.month) : doc.file_name}
                                </p>
                                <p className="text-[10px] text-content-secondary mt-0.5 truncate max-w-[280px]">
                                  {doc.type === "salary_slip" && doc.file_name}
                                  {doc.type === "salary_slip" && " · "}
                                  Uploaded on {new Date(doc.uploaded_at).toLocaleDateString("en-IN")}
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <Button asChild size="sm" variant="secondary" className="h-8 px-2.5 gap-1">
                                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                    <Eye className="size-3.5" />
                                    View
                                  </a>
                                </Button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDoc(doc.id, doc.file_name)}
                                  disabled={pending}
                                  className="p-2 rounded-lg text-content-secondary hover:bg-danger/10 hover:text-danger transition-colors"
                                  title="Delete document"
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. PEOPLE / STAFF PROFILES TAB */}
        {activeTab === "people" && (
          <div className="animate-fade-in grid gap-5 lg:grid-cols-3">
            {/* Left side: Active Staff List */}
            <div className={cn("lg:col-span-1 space-y-3", editingStaffId !== null ? "hidden lg:block" : "block")}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-content-secondary flex items-center gap-1.5">
                Staff Members ({activeStaffList.length})
              </h3>
              
              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {activeStaffList.map((staff) => (
                  <Card 
                    key={staff.id} 
                    className={cn(
                      "p-4 cursor-pointer hover:border-border-strong transition-all duration-200 text-xs space-y-2",
                      editingStaffId === staff.id ? "border-warm bg-white/[0.02]" : "bg-white/[0.01]"
                    )}
                    onClick={() => {
                      setEditingStaffId(staff.id);
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-content-primary flex items-center gap-1.5 min-w-0 truncate">
                        <User className="size-4 text-warm shrink-0" />
                        {staff.name}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {staff.team && (
                          <Badge variant="default" className="text-[9px] px-1.5 py-0 capitalize">
                            {staff.team === "front_desk" ? "Front Desk" : staff.team === "head_chef" ? "Head Chef" : "Kitchen"}
                          </Badge>
                        )}
                        {staff.employee_code && (
                          <Badge variant="default" className="text-[9px] font-mono px-1.5 py-0">
                            {staff.employee_code}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-content-secondary">
                      <p><span className="font-medium text-content-primary">Email:</span> {staff.email || "Not Set"}</p>
                      <p><span className="font-medium text-content-primary">Phone:</span> {staff.phone_number || "Not Set"}</p>
                      {staff.basic_pay && (
                        <p><span className="font-medium text-content-primary">Basic Salary:</span> ₹{staff.basic_pay.toLocaleString("en-IN")}</p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Right side: Edit form */}
            <div className={cn("lg:col-span-2", editingStaffId === null ? "hidden lg:block" : "block")}>
              {editingStaffId ? (
                (() => {
                  const staff = activeStaffList.find((s) => s.id === editingStaffId);
                  if (!staff) return null;
                  
                  return (
                    <Card className="p-5 space-y-4 bg-white/[0.02] border-border/40 animate-fade-in">
                      <div className="flex items-center justify-between border-b border-border/20 pb-3 lg:border-0 lg:pb-0">
                        <div>
                          <h3 className="text-sm font-bold text-content-primary">Update Profile: {staff.name}</h3>
                          <p className="text-xs text-content-secondary mt-0.5">Edit contact information, personal identifiers, and payroll settings</p>
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setEditingStaffId(null)}
                          className="lg:hidden"
                        >
                          ← Back
                        </Button>
                      </div>

                      <form key={staff.id} ref={profileFormRef} action={profileFormAction} encType="multipart/form-data" className="space-y-4 text-xs">
                        <input type="hidden" name="profileId" value={staff.id} />
                        
                        {/* Section 1: Contact Details */}
                        <div className="space-y-3">
                          <h4 className="font-bold text-[10px] uppercase tracking-wider text-warm border-b border-border/20 pb-1">
                            Contact & Profile
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label htmlFor="edit-name">Full Name</Label>
                              <Input id="edit-name" name="name" defaultValue={staff.name} required />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="edit-email">Official Email (Login)</Label>
                              <Input id="edit-email" name="email" type="email" defaultValue={staff.email || ""} required />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label htmlFor="edit-pemail">Personal Email ID</Label>
                              <Input id="edit-pemail" name="personalEmail" type="email" defaultValue={staff.personal_email || ""} placeholder="personal@email.com" />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="edit-phone">Phone Number</Label>
                              <Input id="edit-phone" name="phoneNumber" type="tel" defaultValue={staff.phone_number || ""} placeholder="e.g. 9876543210" />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="edit-address">Residential Address</Label>
                            <Input id="edit-address" name="address" defaultValue={staff.address || ""} placeholder="Full permanent/current address" />
                          </div>
                        </div>

                        {/* Section 2: Identity Details */}
                        <div className="space-y-3 pt-2">
                          <h4 className="font-bold text-[10px] uppercase tracking-wider text-warm border-b border-border/20 pb-1">
                            Identity & Biometric
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label htmlFor="edit-dob">Date of Birth</Label>
                              <Input id="edit-dob" name="dob" type="date" defaultValue={staff.dob || ""} style={{ colorScheme: "dark" }} />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="edit-code">Employee Code</Label>
                              <Input id="edit-code" name="employeeCode" defaultValue={staff.employee_code || ""} placeholder="e.g. BC001" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label htmlFor="edit-aadhar">Aadhar Card Number</Label>
                              <Input id="edit-aadhar" name="aadhar" defaultValue={staff.aadhar_number || ""} placeholder="1234 5678 9012" />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="edit-pan">PAN Number</Label>
                              <Input id="edit-pan" name="pan" defaultValue={staff.pan_number || ""} placeholder="ABCDE1234F" />
                            </div>
                          </div>
                           <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label htmlFor="edit-aadhar-file">Upload Scanned Aadhar (PDF/Image)</Label>
                              <FileInput id="edit-aadhar-file" name="aadharFile" accept="image/*,.pdf" />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="edit-pan-file">Upload Scanned PAN (PDF/Image)</Label>
                              <FileInput id="edit-pan-file" name="panFile" accept="image/*,.pdf" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label htmlFor="edit-pin">Biometric PIN</Label>
                              <Input id="edit-pin" name="biometricPin" defaultValue={staff.biometric_pin || ""} placeholder="PIN mapped in device" />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="edit-biometric-name">Biometric Name</Label>
                              <Input id="edit-biometric-name" name="biometricName" defaultValue={staff.biometric_name || ""} placeholder="Name in biometric machine" />
                            </div>
                          </div>
                        </div>

                        {/* Section 3: Payroll Details */}
                        <div className="space-y-3 pt-2">
                          <h4 className="font-bold text-[10px] uppercase tracking-wider text-warm border-b border-border/20 pb-1">
                            Payroll Details
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label htmlFor="edit-basic">Basic Salary (₹)</Label>
                              <Input id="edit-basic" name="basicPay" type="number" step="0.01" defaultValue={staff.basic_pay ? String(staff.basic_pay) : ""} placeholder="e.g. 18000" />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="edit-through">Default Paid Through</Label>
                              <Input id="edit-through" name="paidThrough" defaultValue={staff.paid_through || ""} placeholder="e.g. Bank Transfer / UPI / Cash" />
                            </div>
                          </div>
                        </div>

                        {/* Section 4: Employment & Authority Details */}
                        <div className="space-y-3 pt-2">
                          <h4 className="font-bold text-[10px] uppercase tracking-wider text-warm border-b border-border/20 pb-1">
                            Employment & Authority
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label htmlFor="edit-designation">Designation</Label>
                              <Input id="edit-designation" name="designation" defaultValue={staff.designation || ""} placeholder="e.g. Manager" />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="edit-joining">Date of Joining</Label>
                              <Input id="edit-joining" name="dateOfJoining" type="date" defaultValue={staff.date_of_joining || ""} style={{ colorScheme: "dark" }} />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label htmlFor="edit-location">Work Location</Label>
                              <Input id="edit-location" name="workLocation" defaultValue={staff.work_location || ""} placeholder="e.g. Bhubaneswar" />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="edit-hours">Working Hours</Label>
                              <Input id="edit-hours" name="workingHours" defaultValue={staff.working_hours || ""} placeholder="e.g. 9:00 AM - 6:00 PM" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label htmlFor="edit-type">Employment Type</Label>
                              <Select id="edit-type" name="employmentType" defaultValue={staff.employment_type || ""}>
                                <option value="">-- Select --</option>
                                <option value="Full-time">Full-time</option>
                                <option value="Part-time">Part-time</option>
                                <option value="Contract">Contract</option>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="edit-team">Checklist Team</Label>
                              <Select id="edit-team" name="team" defaultValue={staff.team || ""}>
                                <option value="">All items (no filter)</option>
                                <option value="kitchen">Kitchen</option>
                                <option value="front_desk">Front Desk</option>
                                <option value="head_chef">Head Chef</option>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="edit-authority">Reporting Authority</Label>
                            <Select id="edit-authority" name="reportingAuthority" defaultValue={staff.reporting_authority || ""}>
                              <option value="">-- None / Self --</option>
                              {staffList
                                .filter((s) => s.role === "owner" || s.role === "admin")
                                .map((admin) => (
                                  <option key={admin.id} value={admin.id}>
                                    {admin.name} ({admin.role})
                                  </option>
                                ))}
                            </Select>
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-4 border-t border-border/40">
                          <Button 
                            type="button" 
                            variant="secondary" 
                            onClick={() => setEditingStaffId(null)}
                          >
                            Cancel
                          </Button>
                          <SubmitButton pendingText="Saving Profile..." className="px-5">
                            Save Changes
                          </SubmitButton>
                        </div>
                      </form>
                    </Card>
                  );
                })()
              ) : (
                <Card className="p-10 text-center space-y-3 bg-white/[0.01] border-border/30 h-full flex flex-col justify-center items-center">
                  <div className="bg-fire/15 text-warm rounded-full p-4 mb-2">
                    <User className="size-10" />
                  </div>
                  <h3 className="text-base font-bold text-content-primary">Select a Staff Member</h3>
                  <p className="text-xs text-content-secondary max-w-sm leading-relaxed">
                    Click on any staff member on the left list to view or edit their complete profile details, biometric mappings, and payroll parameters.
                  </p>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
