"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormState } from "react-dom";
import { toast } from "sonner";
import { Trash2, Pencil, X, Check } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { Confetti } from "@/components/ui/confetti";
import { Input } from "@/components/ui/input";
import type { CashExpense } from "@/lib/database.types";
import type { ExpenseFormState } from "@/app/(app)/expenses/actions";
import {
  updateCashExpense,
  deleteCashExpense,
} from "@/app/(app)/expenses/actions";

const CATEGORY_LABELS: Record<string, string> = {
  withdrawal: "Withdrawal",
  advance:    "Advance",
  expense:    "Expense",
  other:      "Other",
  deposit:    "Deposit",
};

const CATEGORY_COLORS: Record<string, string> = {
  withdrawal: "text-danger",
  advance:    "text-warning",
  expense:    "text-warm",
  other:      "text-content-secondary",
  deposit:    "text-green-400",
};

const isDeposit = (cat: string) => cat === "deposit";

export function CashOutList({
  entries,
  deleteAction,
}: {
  entries: CashExpense[];
  deleteAction: (prev: ExpenseFormState, formData: FormData) => Promise<ExpenseFormState>;
}) {
  return (
    <>
      {entries.map((entry) => (
        <EntryRow key={entry.id} entry={entry} deleteAction={deleteAction} />
      ))}
    </>
  );
}

function EntryRow({
  entry,
  deleteAction,
}: {
  entry: CashExpense;
  deleteAction: (prev: ExpenseFormState, formData: FormData) => Promise<ExpenseFormState>;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const [deleteState, deleteFormAction] = useFormState<ExpenseFormState, FormData>(deleteAction, {});
  const [editState, editFormAction]     = useFormState<ExpenseFormState, FormData>(updateCashExpense, {});

  // Edit field state — pre-filled with existing values
  const [personName, setPersonName] = useState(entry.person_name);
  const [amount,     setAmount]     = useState(String(entry.amount));
  const [category,   setCategory]   = useState<"withdrawal" | "advance" | "expense" | "other" | "deposit">(entry.category);
  const [notes,      setNotes]      = useState(entry.notes ?? "");

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
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata",
  });

  return (
    <>
      <Confetti active={showConfetti} />

      {/* Normal row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-content-primary">{personName}</p>
          <p className="text-xs text-content-secondary">
            <span className={CATEGORY_COLORS[category] ?? "text-content-secondary"}>
              {CATEGORY_LABELS[category] ?? category}
            </span>
            {notes && <> · {notes}</>}
            <span className="ml-1 opacity-60">· {time}</span>
          </p>
        </div>
        <span className={`shrink-0 font-mono text-sm font-bold tabular-nums ${isDeposit(category) ? "text-green-400" : "text-danger"}`}>
          {isDeposit(category) ? "+" : "-"}{formatINR(Number(amount))}
        </span>

        {/* Edit button */}
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className={`ml-1 rounded-lg p-1.5 transition-colors ${
            editing
              ? "bg-fire/15 text-fire"
              : "text-content-secondary hover:bg-bg-elevated hover:text-content-primary"
          }`}
          title={editing ? "Cancel edit" : "Edit entry"}
        >
          {editing ? <X className="size-4" /> : <Pencil className="size-3.5" />}
        </button>

        {/* Delete button */}
        <form action={deleteFormAction}>
          <input type="hidden" name="id" value={entry.id} />
          <button
            type="submit"
            className="rounded-lg p-1.5 text-content-secondary transition-colors hover:bg-danger/10 hover:text-danger"
            title="Delete"
          >
            <Trash2 className="size-4" />
          </button>
        </form>
      </div>

      {/* Inline edit form */}
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
                onChange={(e) => setCategory(e.target.value as "withdrawal" | "advance" | "expense" | "other" | "deposit")}
                className="h-9 w-full rounded-lg border border-border bg-bg-elevated px-2.5 text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-fire/40"
              >
                <option value="withdrawal">Withdrawal</option>
                <option value="advance">Advance</option>
                <option value="expense">Expense</option>
                <option value="other">Other</option>
                <option value="deposit">Deposit ↑</option>
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
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white py-2 text-xs font-bold text-black transition-opacity hover:opacity-90"
            >
              <Check className="size-3.5" strokeWidth={3} /> Save changes
            </button>
          </div>
        </form>
      )}
    </>
  );
}
