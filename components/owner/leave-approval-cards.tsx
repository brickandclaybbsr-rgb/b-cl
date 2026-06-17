"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, X, CalendarClock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Confetti } from "@/components/ui/confetti";
import { formatDateLabel } from "@/lib/date";
import type { StaffLeave } from "@/lib/database.types";

const LEAVE_TYPE_LABELS: Record<string, string> = {
  cl: "Weekly Leave / CL",
  sl: "Sick Leave",
  lwp: "Leave Without Pay",
};

export function LeaveApprovalCards({
  leaves,
  nameMap,
  approveAction,
  rejectAction,
}: {
  leaves: StaffLeave[];
  nameMap: Record<string, string>;
  approveAction: (formData: FormData) => Promise<void>;
  rejectAction: (formData: FormData) => Promise<void>;
}) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleApprove(id: string) {
    setPendingId(id + "_approve");
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", id);
      try {
        await approveAction(fd);
        setShowConfetti(true);
        toast.success("Leave approved ✓");
      } catch {
        toast.error("Failed to approve leave");
      } finally {
        setPendingId(null);
      }
    });
  }

  function handleReject(id: string) {
    setPendingId(id + "_reject");
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", id);
      try {
        await rejectAction(fd);
        toast.success("Leave rejected");
      } catch {
        toast.error("Failed to reject leave");
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <>
      <Confetti active={showConfetti} />
      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
          <CalendarClock className="size-3.5 text-warning" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-content-secondary">
            Leave Requests
          </h2>
          <span className="ml-auto rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-bold text-warning">
            {leaves.length}
          </span>
        </div>
        <div className="divide-y divide-border">
          {leaves.map((leave) => {
            const staffName = nameMap[leave.profile_id] ?? "Staff";
            const isSingleDay = leave.start_date === leave.end_date;
            const dateRange = isSingleDay
              ? formatDateLabel(leave.start_date)
              : `${formatDateLabel(leave.start_date)} – ${formatDateLabel(leave.end_date)}`;
            const approvePending = pendingId === leave.id + "_approve";
            const rejectPending  = pendingId === leave.id + "_reject";

            return (
              <div key={leave.id} className="px-4 py-3 space-y-2.5">
                <div>
                  <p className="text-sm font-semibold">{staffName}</p>
                  <p className="text-xs text-warm mt-0.5">
                    {LEAVE_TYPE_LABELS[leave.leave_type] ?? leave.leave_type} · {dateRange}
                  </p>
                  {leave.reason && (
                    <p className="text-[11px] text-content-secondary mt-1 italic">
                      &ldquo;{leave.reason}&rdquo;
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleApprove(leave.id)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-success/15 px-3 py-1.5 text-xs font-bold text-success transition-colors hover:bg-success/25 disabled:opacity-50"
                  >
                    <Check className="size-3" strokeWidth={3} />
                    {approvePending ? "Approving…" : "Approve"}
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleReject(leave.id)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-danger/10 px-3 py-1.5 text-xs font-bold text-danger transition-colors hover:bg-danger/20 disabled:opacity-50"
                  >
                    <X className="size-3" strokeWidth={3} />
                    {rejectPending ? "Rejecting…" : "Reject"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}
