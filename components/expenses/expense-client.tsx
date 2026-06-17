"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormState } from "react-dom";
import { toast } from "sonner";
import { Trash2, IndianRupee, ArrowDownLeft, Wallet, CalendarDays, Pencil, X, Check } from "lucide-react";
import {
  addCashExpense,
  deleteCashExpense,
  updateCashExpense,
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
  canDelete,
}: {
  entries: CashExpense[];
  isOwner: boolean;
  viewingDate: string;
  canDelete?: boolean;
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

      {/* Date picker — styled card, invisible native input overlaid for tap */}
      <div className="relative flex items-center gap-3 rounded-xl border border-border bg-bg-elevated px-4 py-3.5 cursor-pointer">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-fire/15">
          <CalendarDays className="size-4 text-fire" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-content-secondary">Cash out entry date</p>
          <p className="text-sm font-bold text-content-primary mt-0.5">
            {viewingDate === today
              ? "Today"
              : new Date(viewingDate + "T00:00:00").toLocaleDateString("en-IN", {
                  weekday: "short", day: "numeric", month: "short", year: "numeric",
                })}
          </p>
        </div>
        <span className="text-xs font-semibold text-fire px-3 py-1.5 rounded-lg bg-fire/10 shrink-0">Change</span>
        {/* Invisible native date input covers the whole row */}
        <input
          type="date"
          value={viewingDate}
          max={today}
          onChange={handleDateChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      {/* Entry form — always visible; hidden date field sends the selected date */}
      <form ref={formRef} action={formAction} className="space-y-4">
        <input type="hidden" name="date" value={viewingDate} />
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
              <ExpenseRow key={entry.id} entry={entry} isOwner={isOwner} canDelete={canDelete} />
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

function ExpenseRow({ entry, isOwner, canDelete }: { entry: CashExpense; isOwner: boolean; canDelete?: boolean }) {
  const [deleteState, deleteAction] = useFormState<ExpenseFormState, FormData>(deleteCashExpense, {});
  const [editState, editFormAction] = useFormState<ExpenseFormState, FormData>(updateCashExpense, {});
  const [editing, setEditing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [personName, setPersonName] = useState(entry.person_name);
  const [amount, setAmount] = useState(String(entry.amount));
  const [category, setCategory] = useState(entry.category);
  const [notes, setNotes] = useState(entry.notes ?? "");

  useEffect(() => {
    if (deleteState.error) toast.error(deleteState.error);
  }, [deleteState]);

  useEffect(() => {
    if (editState.error) toast.error(editState.error);
    if (editState.ok) {
      toast.success("Entry updated ✓");
      setShowConfetti(true);
      setEditing(false);
    }
  }, [editState]);

  const time = new Date(entry.submitted_at).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });

  const withinTwoHours = Date.now() - new Date(entry.submitted_at).getTime() < 2 * 60 * 60 * 1000;
  const showDelete = isOwner || (canDelete && withinTwoHours);

  return (
    <>
      <Confetti active={showConfetti} />

      {/* Normal row */}
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
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className={`rounded-lg p-1.5 transition-colors ${
              editing
                ? "bg-fire/15 text-fire"
                : "text-content-secondary hover:bg-bg-elevated hover:text-content-primary"
            }`}
            title={editing ? "Cancel edit" : "Edit entry"}
          >
            {editing ? <X className="size-4" /> : <Pencil className="size-3.5" />}
          </button>
        )}
        {showDelete && (
          <form action={deleteAction}>
            <input type="hidden" name="id" value={entry.id} />
            <button
              type="submit"
              className="rounded-lg p-1.5 text-content-secondary transition-colors hover:bg-danger/10 hover:text-danger"
              title="Delete entry"
            >
              <Trash2 className="size-4" />
            </button>
          </form>
        )}
      </div>

      {/* Inline edit form — owner only */}
      {editing && (
        <form action={editFormAction} className="border-t border-border/60 bg-bg-elevated/40 px-4 py-3 space-y-2.5">
          <input type="hidden" name="id" value={entry.id} />
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-content-secondary">
                Person / Purpose
              </label>
              <Input
                name="person_name"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="Name or purpose"
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-content-secondary">
                Amount (₹)
              </label>
              <Input
                name="amount"
                type="number"
                inputMode="decimal"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-9 font-mono text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-content-secondary">
                Type
              </label>
              <select
                name="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as "withdrawal" | "advance" | "expense" | "other")}
                className="h-9 w-full rounded-lg border border-border bg-bg-elevated px-2.5 text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-fire/40"
              >
                <option value="withdrawal">Withdrawal</option>
                <option value="advance">Advance</option>
                <option value="expense">Expense</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-content-secondary">
                Notes
              </label>
              <Input
                name="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional note"
                className="h-9 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex-1 rounded-lg border border-border bg-bg-elevated py-2 text-xs font-semibold text-content-secondary transition-colors hover:text-content-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-fire py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
            >
              <Check className="size-3.5" strokeWidth={3} /> Save changes
            </button>
          </div>
        </form>
      )}
    </>
  );
}
