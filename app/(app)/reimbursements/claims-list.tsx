"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Check, Flag, Download, Clock, CheckCircle2, AlertTriangle, CheckSquare } from "lucide-react";
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
  pending:  { label: "Logged — Unreconciled", variant: "warning"  as const, icon: Clock },
  approved: { label: "Reconciled",            variant: "success"  as const, icon: CheckCircle2 },
  rejected: { label: "Flagged",               variant: "danger"   as const, icon: AlertTriangle },
  paid:     { label: "Reconciled",            variant: "success"  as const, icon: CheckSquare },
};

export function ReimbursementsList({ claims, isOwner }: Props) {
  const [busy, startTransition] = useTransition();

  function handleReconcile(id: string) {
    startTransition(async () => {
      const res = await approveClaim(id);
      if (res?.error) toast.error(res.error);
      else toast.success("Expense reconciled ✓");
    });
  }

  function handleFlag(id: string) {
    startTransition(async () => {
      const res = await rejectClaim(id);
      if (res?.error) toast.error(res.error);
      else toast.warning("Expense flagged for review");
    });
  }

  const unreconciled = claims.filter((c) => c.status === "pending");
  const reconciled   = claims.filter((c) => c.status === "approved" || c.status === "paid");
  const flagged      = claims.filter((c) => c.status === "rejected");

  function ClaimCard({ c, showActions }: { c: ReimbursementView; showActions?: boolean }) {
    const meta = STATUS_META[c.status];
    const Icon = meta.icon;
    return (
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {isOwner && (
                <span className="font-semibold text-content-primary">{c.submitted_by_name}</span>
              )}
              <span className="font-bold text-fire">
                ₹{Number(c.amount).toLocaleString("en-IN")}
              </span>
              <Badge variant={meta.variant} className="gap-1 text-xs">
                <Icon className="size-3" />
                {meta.label}
              </Badge>
            </div>
            <p className="mt-0.5 text-[11px] text-content-secondary">
              {formatDateLabel(c.submitted_at)}
              {c.processed_by_name && ` · ${c.processed_by_name}`}
            </p>
            <p className="mt-1.5 text-sm font-medium text-content-primary">{c.purpose}</p>
            {c.notes && (
              <p className="mt-0.5 text-xs text-content-secondary italic">{c.notes}</p>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap gap-2 self-start">
            {c.receipt_url && (
              <Button asChild size="sm" variant="secondary" className="gap-1">
                <a href={c.receipt_url} target="_blank" rel="noreferrer">
                  <Download className="size-3.5" />
                  Bill
                </a>
              </Button>
            )}
            {isOwner && showActions && (
              <>
                <Button
                  size="sm"
                  variant="success"
                  disabled={busy}
                  onClick={() => handleReconcile(c.id)}
                  className="gap-1"
                >
                  <Check className="size-3.5" />
                  Reconcile
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => handleFlag(c.id)}
                  className="gap-1 hover:border-danger/30 hover:text-danger"
                >
                  <Flag className="size-3.5" />
                  Flag
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-content-secondary">
          Needs Reconciliation ({unreconciled.length})
        </h2>
        {unreconciled.length === 0 ? (
          <p className="rounded-xl border border-border bg-bg-card/45 p-4 text-sm italic text-content-secondary">
            All expenses reconciled.
          </p>
        ) : (
          unreconciled.map((c) => (
            <ClaimCard key={c.id} c={c} showActions />
          ))
        )}
      </section>

      {flagged.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-danger">
            Flagged ({flagged.length})
          </h2>
          {flagged.map((c) => (
            <ClaimCard key={c.id} c={c} showActions />
          ))}
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-content-secondary">
          Reconciled History ({reconciled.length})
        </h2>
        {reconciled.length === 0 ? (
          <p className="rounded-xl border border-border bg-bg-card/45 p-4 text-sm italic text-content-secondary">
            No history yet.
          </p>
        ) : (
          <div className="space-y-2 opacity-75">
            {reconciled.map((c) => (
              <ClaimCard key={c.id} c={c} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
