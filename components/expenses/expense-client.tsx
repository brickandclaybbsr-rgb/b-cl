"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormState } from "react-dom";
import { toast } from "sonner";
import { Trash2, IndianRupee, ArrowDownLeft, Wallet, CalendarDays } from "lucide-react";
import {
  addCashExpense,
  deleteCashExpense,
  type ExpenseFormState,
} from "@/app/(app)/expenses/actions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Confetti } from "@/components/ui/confetti";
import { formatINR } from "@/lib/utils";
import type { CashExpense } from "@/lib/database.types";

const CATEGORY_LABELS: Record<string, string> = {
  withdrawal: "Cash Withdrawal",
  advance:    "Salary Advance",
  expense:    "Expense",
  other:      "Other",
};

const CATEGORY_COLORS: Record<string, string> = {
  withdrawal: "text-danger",
  advance:    "text-warning",
  expense:    "text-warm",
  other:      "text-content-secondary",
};

export function ExpenseClient({
  entries,
  isOwner,
  viewingDate,
}: {
  entries: CashExpense[];
  isOwner: boolean;
  viewingDate: string;
}) {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const isToday = viewingDate === today;
  const [state, formAction] = useFormState<ExpenseFormState, FormData>(addCashExpense, {});
  const [showConfetti, setShowConfetti] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.ok) {
      toast.success("Cash expense logged ✓");
      setShowConfetti(true);
      formRef.current?.reset();
    }
  }, [state]);

  const router = useRouter();
  const total = entries.reduce((s, e) => s + Number(e.amount), 0);

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const d = e.target.value;
    if (d === today) {
      router.push("/sales?tab=expenses");
    } else {
      router.push(`/sales?tab=expenses&date=${d}`);
    }
  }

  return (
    <>
      <Confetti active={showConfetti} />

      {/* Date picker */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-bg-elevated px-4 py-3">
        <CalendarDays className="size-4 shrink-0 text-content-secondary" />
        <span className="flex-1 text-sm text-content-secondary">Viewing date</span>
        <input
          type="date"
          value={viewingDate}
          max={today}
          onChange={handleDateChange}
          className="rounded-lg border border-border bg-bg-base px-2 py-1 text-sm font-semibold text-content-primary focus:outline-none focus:ring-2 focus:ring-fire/40"
        />
      </div>

      {/* Entry form — only shown for today */}
      {isToday && (<form ref={formRef} action={formAction} className="space-y-4">
        <Card className="space-y-4 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="person_name">Person / Purpose</Label>
            <Input
              id="person_name"
              name="person_name"
              placeholder="e.g. Satya Sir, John Sir, Grocery run"
              autoComplete="off"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                inputMode="decimal"
                min="1"
                step="0.01"
                placeholder="0"
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category">Type</Label>
              <select
                id="category"
                name="category"
                defaultValue="withdrawal"
                className="h-10 w-full rounded-lg border border-border bg-bg-elevated px-3 text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-fire/40"
              >
                <option value="withdrawal">Cash Withdrawal</option>
                <option value="advance">Salary Advance</option>
                <option value="expense">Expense</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input id="notes" name="notes" placeholder="Any additional detail" />
          </div>
        </Card>

        <SubmitButton className="w-full" size="lg" pendingText="Logging…">
          <ArrowDownLeft className="size-4" />
          Log Cash Out
        </SubmitButton>
      </form>
      )}

      {/* Entries list */}
      {entries.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-danger/10 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-danger">
              <Wallet className="size-4" />
              Total cash out{isToday ? " today" : ""}
            </div>
            <span className="font-mono text-xl font-bold tabular-nums text-danger">
              {formatINR(total)}
            </span>
          </div>

          <Card className="divide-y divide-border overflow-hidden">
            {entries.map((entry) => (
              <ExpenseRow key={entry.id} entry={entry} isOwner={isOwner} />
            ))}
          </Card>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-10 text-center text-content-secondary">
          <IndianRupee className="size-8 opacity-30" />
          <p className="text-sm">No cash expenses logged today.</p>
        </div>
      )}
    </>
  );
}

function ExpenseRow({ entry, isOwner }: { entry: CashExpense; isOwner: boolean }) {
  const [deleteState, deleteAction] = useFormState<ExpenseFormState, FormData>(deleteCashExpense, {});

  useEffect(() => {
    if (deleteState.error) toast.error(deleteState.error);
  }, [deleteState]);

  const time = new Date(entry.submitted_at).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-content-primary">
          {entry.person_name}
        </p>
        <p className="text-xs text-content-secondary">
          <span className={CATEGORY_COLORS[entry.category] ?? "text-content-secondary"}>
            {CATEGORY_LABELS[entry.category] ?? entry.category}
          </span>
          {entry.notes && <> · {entry.notes}</>}
          <span className="ml-1 opacity-60">· {time}</span>
        </p>
      </div>
      <span className="shrink-0 font-mono text-base font-bold tabular-nums text-danger">
        -{formatINR(Number(entry.amount))}
      </span>
      {isOwner && (
        <form action={deleteAction}>
          <input type="hidden" name="id" value={entry.id} />
          <button
            type="submit"
            className="ml-1 rounded-lg p-1.5 text-content-secondary transition-colors hover:bg-danger/10 hover:text-danger"
            title="Delete entry"
          >
            <Trash2 className="size-4" />
          </button>
        </form>
      )}
    </div>
  );
}
