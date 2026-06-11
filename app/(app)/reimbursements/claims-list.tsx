"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Check, X, Download, Clock, CheckCircle2, XCircle, CheckSquare } from "lucide-react";
import { approveClaim, rejectClaim, markClaimPaid } from "./actions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateLabel } from "@/lib/date";

export type ReimbursementView = {
  id: string;
  submitted_by: string;
  submitted_by_name: string;
  amount: number;
  purpose: string;
  receipt_url: string | null;
  status: "pending" | "approved" | "rejected" | "paid";
  notes: string | null;
  submitted_at: string;
  processed_by: string | null;
  processed_by_name?: string;
  processed_at: string | null;
};

interface Props {
  claims: ReimbursementView[];
  isOwner: boolean;
}

const STATUS_META = {
  pending: { label: "Pending", variant: "warning", icon: Clock },
  approved: { label: "Approved (Unpaid)", variant: "fire", icon: CheckCircle2 },
  rejected: { label: "Rejected", variant: "danger", icon: XCircle },
  paid: { label: "Paid", variant: "success", icon: CheckSquare },
} as const;

export function ReimbursementsList({ claims, isOwner }: Props) {
  const [pending, startTransition] = useTransition();

  function handleApprove(id: string) {
    if (confirm("Are you sure you want to APPROVE this claim?")) {
      startTransition(async () => {
        try {
          const res = await approveClaim(id);
          if (res?.error) toast.error(res.error);
          else toast.success("Claim approved ✓");
        } catch (err: any) {
          console.error("Failed to approve claim:", err);
          toast.error("Error: " + (err?.message || "Failed to approve claim"));
        }
      });
    }
  }

  function handleReject(id: string) {
    if (confirm("Are you sure you want to REJECT this claim?")) {
      startTransition(async () => {
        try {
          const res = await rejectClaim(id);
          if (res?.error) toast.error(res.error);
          else toast.error("Claim rejected ❌");
        } catch (err: any) {
          console.error("Failed to reject claim:", err);
          toast.error("Error: " + (err?.message || "Failed to reject claim"));
        }
      });
    }
  }

  function handleMarkPaid(id: string) {
    if (confirm("Mark this claim as PAID? This will complete the reimbursement.")) {
      startTransition(async () => {
        try {
          const res = await markClaimPaid(id);
          if (res?.error) toast.error(res.error);
          else toast.success("Reimbursement marked as Paid ✓");
        } catch (err: any) {
          console.error("Failed to mark claim paid:", err);
          toast.error("Error: " + (err?.message || "Failed to mark claim as paid"));
        }
      });
    }
  }

  const pendingClaims = claims.filter((c) => c.status === "pending");
  const approvedClaims = claims.filter((c) => c.status === "approved");
  const historyClaims = claims.filter((c) => c.status === "paid" || c.status === "rejected");

  return (
    <div className="space-y-6">
      {/* 1. Pending Claims Section */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-content-secondary">
          Pending Approval ({pendingClaims.length})
        </h2>
        {pendingClaims.length === 0 ? (
          <p className="text-sm text-content-secondary italic p-4 bg-bg-card/45 rounded-xl border border-border">
            No claims pending approval.
          </p>
        ) : (
          <div className="space-y-3">
            {pendingClaims.map((c) => {
              const meta = STATUS_META[c.status];
              const Icon = meta.icon;
              return (
                <Card key={c.id} className="p-4 border-l-2 border-l-warning">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-content-primary">
                          {c.submitted_by_name}
                        </span>
                        <span className="font-bold text-success">
                          ₹{c.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                        <Badge variant={meta.variant} className="gap-1 text-xs">
                          <Icon className="size-3" />
                          {meta.label}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-content-secondary">
                        Submitted: {formatDateLabel(c.submitted_at)}
                      </p>
                      <p className="mt-2 text-sm font-medium text-content-primary">
                        {c.purpose}
                      </p>
                      {c.notes && (
                        <p className="mt-1 text-xs text-content-secondary italic">
                          Note: {c.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 self-start sm:self-auto">
                      {c.receipt_url && (
                        <Button asChild size="sm" variant="secondary" className="gap-1">
                          <a href={c.receipt_url} target="_blank" rel="noreferrer">
                            <Download className="size-3.5" />
                            Receipt
                          </a>
                        </Button>
                      )}
                      
                      {isOwner && (
                        <>
                          <Button
                            size="sm"
                            variant="success"
                            disabled={pending}
                            onClick={() => handleApprove(c.id)}
                            className="gap-1"
                          >
                            <Check className="size-3.5" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={pending}
                            onClick={() => handleReject(c.id)}
                            className="gap-1 hover:bg-danger/10 hover:text-danger hover:border-danger/20"
                          >
                            <X className="size-3.5" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* 2. Approved (Unpaid) Section */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-content-secondary">
          Approved & Awaiting Payment ({approvedClaims.length})
        </h2>
        {approvedClaims.length === 0 ? (
          <p className="text-sm text-content-secondary italic p-4 bg-bg-card/45 rounded-xl border border-border">
            No approved claims awaiting payment.
          </p>
        ) : (
          <div className="space-y-3">
            {approvedClaims.map((c) => {
              const meta = STATUS_META[c.status];
              const Icon = meta.icon;
              return (
                <Card key={c.id} className="p-4 border-l-2 border-l-fire bg-fire/5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-content-primary">
                          {c.submitted_by_name}
                        </span>
                        <span className="font-bold text-success">
                          ₹{c.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                        <Badge variant={meta.variant} className="gap-1 text-xs">
                          <Icon className="size-3" />
                          {meta.label}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-content-secondary">
                        Approved: {c.processed_at ? formatDateLabel(c.processed_at) : formatDateLabel(c.submitted_at)}
                      </p>
                      <p className="mt-2 text-sm font-medium text-content-primary">
                        {c.purpose}
                      </p>
                      {c.notes && (
                        <p className="mt-1 text-xs text-content-secondary italic">
                          Note: {c.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 self-start sm:self-auto">
                      {c.receipt_url && (
                        <Button asChild size="sm" variant="secondary" className="gap-1">
                          <a href={c.receipt_url} target="_blank" rel="noreferrer">
                            <Download className="size-3.5" />
                            Receipt
                          </a>
                        </Button>
                      )}
                      
                      {isOwner && (
                        <Button
                          size="sm"
                          variant="success"
                          disabled={pending}
                          onClick={() => handleMarkPaid(c.id)}
                          className="gap-1 bg-success text-white hover:bg-success/80 border-0"
                        >
                          <CheckSquare className="size-3.5" />
                          Mark as Paid
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. History Section */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-content-secondary">
          Claim History ({historyClaims.length})
        </h2>
        {historyClaims.length === 0 ? (
          <p className="text-sm text-content-secondary italic p-4 bg-bg-card/45 rounded-xl border border-border">
            No history available.
          </p>
        ) : (
          <div className="space-y-3">
            {historyClaims.map((c) => {
              const meta = STATUS_META[c.status];
              const Icon = meta.icon;
              return (
                <Card key={c.id} className="p-4 opacity-85">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-content-primary">
                          {c.submitted_by_name}
                        </span>
                        <span className="font-bold text-content-secondary">
                          ₹{c.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                        <Badge variant={meta.variant} className="gap-1 text-xs">
                          <Icon className="size-3" />
                          {meta.label}
                        </Badge>
                      </div>
                      <p className="mt-1 text-[11px] text-content-secondary">
                        Submitted: {formatDateLabel(c.submitted_at)}
                        {c.processed_by_name && ` · Resolved by: ${c.processed_by_name}`}
                        {c.processed_at && ` on ${formatDateLabel(c.processed_at)}`}
                      </p>
                      <p className="mt-2 text-sm text-content-primary">
                        {c.purpose}
                      </p>
                      {c.notes && (
                        <p className="mt-1 text-xs text-content-secondary italic">
                          Note: {c.notes}
                        </p>
                      )}
                    </div>

                    {c.receipt_url && (
                      <Button asChild size="sm" variant="secondary" className="gap-1 self-start sm:self-auto">
                        <a href={c.receipt_url} target="_blank" rel="noreferrer">
                          <Download className="size-3.5" />
                          Receipt
                        </a>
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
