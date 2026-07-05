"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { toast } from "sonner";
import { Confetti } from "@/components/ui/confetti";
import { 
  FileText, 
  CalendarDays, 
  Calendar, 
  Download, 
  Plus, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  FileSignature,
  Info
} from "lucide-react";
import { applyLeave, deleteLeave } from "@/app/(app)/attendance/actions-hr";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";

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
  type: "appointment_letter" | "salary_slip";
  month: string | null;
  file_url: string;
  file_name: string;
  uploaded_at: string;
}

interface Props {
  initialLeaves: LeaveRequest[];
  initialDocuments: StaffDocument[];
  attendanceChild: React.ReactNode;
}

function hasWeekendDays(startStr: string, endStr: string): boolean {
  if (!startStr || !endStr) return false;
  const start = new Date(startStr + "T00:00:00");
  const end = new Date(endStr + "T00:00:00");
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return false;
  
  const current = new Date(start);
  let iterations = 0;
  while (current <= end && iterations < 366) {
    const day = current.getDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday
    if (day === 0 || day === 5 || day === 6) {
      return true;
    }
    current.setDate(current.getDate() + 1);
    iterations++;
  }
  return false;
}

function getDurationInDays(startDateStr: string, endDateStr: string): number {
  const start = new Date(startDateStr + "T00:00:00");
  const end = new Date(endDateStr + "T00:00:00");
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0;
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
  return diffDays;
}

function calculateOwnUsedLeaves(leaves: LeaveRequest[]) {
  let clUsed = 0;
  let slUsed = 0;
  const currentYear = new Date().getFullYear().toString();
  
  leaves.forEach((leave) => {
    if (leave.status === "approved") {
      if (leave.start_date.startsWith(currentYear)) {
        const days = getDurationInDays(leave.start_date, leave.end_date);
        if (leave.leave_type === "cl") clUsed += days;
        if (leave.leave_type === "sl") slUsed += days;
      }
    }
  });
  
  return {
    clUsed,
    slUsed,
    clRemaining: Math.max(0, 48 - clUsed),
    slRemaining: Math.max(0, 6 - slUsed),
  };
}

export function ProfileClient({ initialLeaves, initialDocuments, attendanceChild }: Props) {
  const [activeTab, setActiveTab] = useState<"attendance" | "documents" | "leaves">("attendance");
  const [leaves, setLeaves] = useState<LeaveRequest[]>(initialLeaves);
  const [documents, setDocuments] = useState<StaffDocument[]>(initialDocuments);
  const [showPolicy, setShowPolicy] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  // Form input state for policy validations
  const [leaveType, setLeaveType] = useState<"cl" | "sl" | "lwp">("cl");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [agreeNotice, setAgreeNotice] = useState<boolean>(false);

  // useFormState for applyLeave server action
  const [state, formAction] = useFormState(applyLeave, {});

  // Sync state if initial props change
  useEffect(() => {
    setLeaves(initialLeaves);
  }, [initialLeaves]);

  useEffect(() => {
    setDocuments(initialDocuments);
  }, [initialDocuments]);

  // Handle server action result
  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    } else if (state.ok) {
      toast.success(state.message || "Leave request submitted successfully.");
      setShowConfetti(true);
      formRef.current?.reset();
      setLeaveType("cl");
      setStartDate("");
      setEndDate("");
      setAgreeNotice(false);
      window.location.reload();
    }
  }, [state]);

  // Check 1: 2-day advance notice warning
  let isLessThan2DaysCL = false;
  if (leaveType === "cl" && startDate) {
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const parts = formatter.formatToParts(now);
      const year = parts.find((p) => p.type === "year")?.value;
      const month = parts.find((p) => p.type === "month")?.value;
      const day = parts.find((p) => p.type === "day")?.value;
      if (year && month && day) {
        const todayDate = new Date(`${year}-${month}-${day}T00:00:00`);
        const minAdvanceDate = new Date(todayDate);
        minAdvanceDate.setDate(todayDate.getDate() + 2);
        
        const start = new Date(startDate + "T00:00:00");
        if (!isNaN(start.getTime()) && start < minAdvanceDate) {
          isLessThan2DaysCL = true;
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Check 2: Friday, Saturday, Sunday warning
  const isWeekendLeave = leaveType === "cl" && hasWeekendDays(startDate, endDate);

  const isSubmitDisabled = leaveType === "cl" && isLessThan2DaysCL && !agreeNotice;

  const { clRemaining, slRemaining } = calculateOwnUsedLeaves(leaves);

  const handleCancelLeave = (leaveId: string) => {
    if (!confirm("Are you sure you want to cancel this leave request?")) return;
    startTransition(async () => {
      const res = await deleteLeave(leaveId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.message || "Request cancelled.");
        window.location.reload();
      }
    });
  };

  // Helper to format YYYY-MM
  const formatMonth = (monthStr: string | null) => {
    if (!monthStr) return "";
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  };

  // Split documents by type
  const appointmentLetters = documents.filter((d) => d.type === "appointment_letter");
  const salarySlips = documents.filter((d) => d.type === "salary_slip").sort((a, b) => {
    return (b.month || "").localeCompare(a.month || "");
  });

  return (
    <div className="space-y-5">
      <Confetti active={showConfetti} />
      {/* Tabs Selector */}
      <div className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:px-0 border-b border-border/40 pb-3">
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
          Attendance Logs
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
          My Documents
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
          Leave Requests
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {/* ATTENDANCE TAB */}
        {activeTab === "attendance" && (
          <div className="animate-fade-in">
            {attendanceChild}
          </div>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === "documents" && (
          <div className="animate-fade-in space-y-5">
            {/* Appointment Letters Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-content-secondary flex items-center gap-1.5">
                <FileSignature className="size-4 text-warm" />
                Appointment Letters
              </h3>
              {appointmentLetters.length === 0 ? (
                <Card className="p-5 text-center text-xs text-content-secondary">
                  No appointment letter uploaded yet.
                </Card>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {appointmentLetters.map((doc) => (
                    <Card key={doc.id} className="p-4 flex items-center justify-between gap-3 bg-white/[0.01]">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate text-content-primary">{doc.file_name}</p>
                        <p className="text-[10px] text-content-secondary mt-0.5">
                          Uploaded on {new Date(doc.uploaded_at).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                      <Button asChild size="sm" variant="secondary" className="shrink-0 gap-1">
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                          <Download className="size-3.5" />
                          View
                        </a>
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </div>


          </div>
        )}

        {/* LEAVES TAB */}
        {activeTab === "leaves" && (
          <div className="animate-fade-in grid gap-5 lg:grid-cols-3">
            {/* Left Column: Form & Policy Guidelines */}
            <div className="lg:col-span-1 space-y-4">
              {/* Leave Balance Card */}
              <Card className="p-4 bg-bg-elevated/40 border-border text-xs space-y-3">
                <h4 className="font-bold text-sm text-content-primary pb-1.5 border-b border-border/40">
                  My Leave Balances ({new Date().getFullYear()})
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 bg-white/[0.01] border border-border/20 p-2.5 rounded-xl text-center">
                    <span className="text-[10px] uppercase font-bold text-content-secondary text-left block">Weekly Leave / CL</span>
                    <p className="text-xl font-bold text-warm font-mono text-left">{clRemaining} <span className="text-xs font-normal text-content-secondary">/ 48</span></p>
                    <span className="text-[9px] text-content-secondary block text-left">Days Remaining (4/month)</span>
                  </div>
                  <div className="space-y-1 bg-white/[0.01] border border-border/20 p-2.5 rounded-xl text-center">
                    <span className="text-[10px] uppercase font-bold text-content-secondary text-left block">Sick Leave (SL)</span>
                    <p className="text-xl font-bold text-warm font-mono text-left">{slRemaining} <span className="text-xs font-normal text-content-secondary">/ 6</span></p>
                    <span className="text-[9px] text-content-secondary block text-left">Days Remaining</span>
                  </div>
                </div>
              </Card>

              {/* Apply Leave Form */}
              <Card className="p-5 h-fit space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-content-primary">Apply for Leave</h3>
                  <p className="text-xs text-content-secondary mt-0.5">Submit a new leave request for manager review</p>
                </div>

                <form ref={formRef} action={formAction} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="leaveType">Leave Type</Label>
                    <Select 
                      id="leaveType" 
                      name="leaveType" 
                      required 
                      value={leaveType}
                      onChange={(e) => {
                        const val = e.target.value as "cl" | "sl" | "lwp";
                        setLeaveType(val);
                        setAgreeNotice(false);
                      }}
                    >
                      <option value="cl">Weekly Leave / CL — 48 days/yr (4 per month)</option>
                      <option value="sl">Sick Leave (SL) — 6 days/yr</option>
                      <option value="lwp">Leave Without Pay (LWP)</option>
                    </Select>
                  </div>

                  <div className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="startDate">From Date</Label>
                        <Input
                          id="startDate"
                          name="startDate"
                          type="date"
                          required
                          style={{ colorScheme: "dark" }}
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="endDate">To Date</Label>
                        <Input
                          id="endDate"
                          name="endDate"
                          type="date"
                          required
                          style={{ colorScheme: "dark" }}
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                    {startDate && endDate && getDurationInDays(startDate, endDate) > 0 && (
                      <div className="flex items-center justify-center gap-2 rounded-lg border border-fire/20 bg-fire/8 px-3 py-2.5">
                        <CalendarDays className="size-3.5 text-warm shrink-0" />
                        <span className="text-sm font-bold text-warm">
                          {getDurationInDays(startDate, endDate)} day{getDurationInDays(startDate, endDate) !== 1 ? "s" : ""}
                        </span>
                        <span className="text-xs text-content-secondary">leave requested</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reason">Reason for Leave</Label>
                    <Textarea
                      id="reason"
                      name="reason"
                      placeholder="e.g. Family function / Personal emergency"
                      rows={3}
                      required
                    />
                  </div>

                  {/* Policy Warnings & Acknowledgments */}
                  {leaveType === "cl" && isLessThan2DaysCL && (
                    <div className="rounded-xl border border-warning/30 bg-warning/5 p-3.5 space-y-2.5 text-xs animate-fade-in">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="size-4 text-warning shrink-0 mt-0.5" />
                        <div className="text-content-primary leading-relaxed">
                          <p className="font-semibold text-warning">Notice Policy Warning</p>
                          <p className="text-content-secondary mt-0.5">
                            Weekly Leave (CL) must be applied at least 2 days in advance.
                          </p>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer pt-2 border-t border-warning/10 text-content-primary select-none">
                        <input
                          type="checkbox"
                          name="acknowledgeNotice"
                          checked={agreeNotice}
                          onChange={(e) => setAgreeNotice(e.target.checked)}
                          className="rounded border-border bg-bg-elevated text-warm focus:ring-warm focus:ring-offset-bg-card"
                          required
                        />
                        <span className="font-medium text-[11px] leading-snug">
                          I will keep this in mind and try to apply for leave
                        </span>
                      </label>
                    </div>
                  )}

                  {leaveType === "cl" && isWeekendLeave && (
                    <div className="rounded-xl border border-warning/30 bg-warning/5 p-3.5 text-xs animate-fade-in">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="size-4 text-warning shrink-0 mt-0.5" />
                        <div className="text-content-primary leading-relaxed">
                          <p className="font-semibold text-warning">Weekend Leave Notice</p>
                          <p className="text-content-secondary mt-0.5">
                            As you are applying for Friday, Saturday, or Sunday, you might not get leave approved as it is very early. If emergency, it may get approved by the committee.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <SubmitButton pendingText="Submitting..." disabled={isSubmitDisabled} className="w-full">
                    <Plus className="size-4" />
                    Submit Request
                  </SubmitButton>
                </form>
              </Card>

              {/* Leave Policy Card */}
              <Card className="p-4 text-xs border-border-strong bg-bg-elevated/40">
                <div 
                  className="flex items-center justify-between cursor-pointer sm:cursor-default" 
                  onClick={() => setShowPolicy(!showPolicy)}
                >
                  <h4 className="font-bold text-sm text-warm flex items-center gap-1.5">
                    <Info className="size-4" /> B&C Leave Policy
                  </h4>
                  <button 
                    type="button" 
                    className="text-[10px] font-semibold text-warm sm:hidden bg-white/5 hover:bg-white/10 px-2 py-1 rounded"
                  >
                    {showPolicy ? "Collapse" : "Expand"}
                  </button>
                </div>
                
                <div className={cn("space-y-3.5 mt-3 pt-3 border-t border-border/40 sm:border-t-0 sm:pt-0 sm:mt-0", showPolicy ? "block animate-fade-in" : "hidden sm:block")}>
                  <div className="space-y-2">
                    <div className="flex justify-between border-b border-border/30 pb-1">
                      <span className="font-semibold text-content-primary">Weekly Leave / CL</span>
                      <span className="text-content-secondary font-mono">48 days/yr (4/mo)</span>
                    </div>
                    <p className="text-[10px] text-content-secondary leading-relaxed">
                      Also called Weekly Leave by staff. Prior approval required. Not allowed on Fridays, Saturdays, or Sundays unless medical emergency (requires SL + certificate).
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between border-b border-border/30 pb-1">
                      <span className="font-semibold text-content-primary">Sick Leave (SL)</span>
                      <span className="text-content-secondary font-mono">6 days/yr</span>
                    </div>
                    <p className="text-[10px] text-content-secondary leading-relaxed">
                      Lapses at year-end. Requires a **medical certificate** if leave exceeds 2 consecutive days.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between border-b border-border/30 pb-1">
                      <span className="font-semibold text-content-primary">Leave Without Pay (LWP)</span>
                      <span className="text-content-secondary font-mono">As applicable</span>
                    </div>
                    <p className="text-[10px] text-content-secondary leading-relaxed">
                      Can only be applied after CL and SL balances have been completely exhausted.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border/40 space-y-1 text-[10px] text-content-secondary leading-relaxed">
                    <p className="font-semibold text-content-primary">Guidelines & Restrictions:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Apply **at least 2 days in advance** for Casual Leaves.</li>
                      <li>Weekend & Festival leaves require Mr. Satya Ranjjan Das or Mr. John Das's signature approval.</li>
                      <li>Unapproved absences may result in salary deductions.</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>

            {/* Leave History List */}
            <div className="lg:col-span-2 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-content-secondary flex items-center gap-1.5">
                <CalendarDays className="size-4 text-warm" />
                Leave Request History
              </h3>

              {leaves.length === 0 ? (
                <Card className="p-6 text-center text-xs text-content-secondary">
                  You have not submitted any leave requests yet.
                </Card>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {leaves.map((leave) => {
                    const from = new Date(leave.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
                    const to = new Date(leave.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
                    
                    return (
                      <Card key={leave.id} className="p-4 space-y-3 hover:border-border-strong transition-colors bg-bg-card">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-content-primary">
                              {from} {from !== to && `to ${to}`}
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <Badge variant="default" className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0 bg-bg-elevated text-content-primary border border-border/30">
                                {leave.leave_type === "cl" ? "Weekly Leave / CL" : leave.leave_type === "sl" ? "Sick Leave (SL)" : "Leave Without Pay (LWP)"}
                              </Badge>
                            </div>
                            <p className="text-[10px] text-content-secondary mt-1">
                              Submitted {new Date(leave.submitted_at).toLocaleDateString("en-IN")}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {leave.status === "pending" && (
                              <Badge variant="warning" className="text-[10px] uppercase font-bold px-2 py-0.5">Pending</Badge>
                            )}
                            {leave.status === "approved" && (
                              <Badge variant="success" className="text-[10px] uppercase font-bold px-2 py-0.5">Approved</Badge>
                            )}
                            {leave.status === "rejected" && (
                              <Badge variant="danger" className="text-[10px] uppercase font-bold px-2 py-0.5">Rejected</Badge>
                            )}

                            {leave.status === "pending" && (
                              <button
                                type="button"
                                onClick={() => handleCancelLeave(leave.id)}
                                disabled={pending}
                                className="p-1 rounded-lg text-content-secondary hover:bg-danger/10 hover:text-danger transition-colors"
                                title="Cancel request"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="text-xs text-content-secondary">
                          <span className="font-semibold text-content-primary">Reason: </span>
                          {leave.reason}
                        </div>

                        {leave.notes && (
                          <div className="flex items-start gap-1.5 bg-bg-elevated/40 border border-border/50 rounded-lg p-2 text-xs">
                            <AlertCircle className="size-3.5 text-content-secondary shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-content-primary">Manager Note:</span>
                              <p className="mt-0.5 text-content-secondary">{leave.notes}</p>
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
