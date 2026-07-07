"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormState } from "react-dom";
import { toast } from "sonner";
import {
  Trash2, IndianRupee, ArrowDownLeft, Wallet, CalendarDays,
  Pencil, X, Check, ChevronDown, ChevronRight, Plus,
} from "lucide-react";
import {
  addCashExpense,
  addMultipleCashExpenses,
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
  deposit:    "Deposit",
};

const CATEGORY_LABELS_SHORT: Record<string, string> = {
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

type EntryRow = {
  personName: string;
  amount: string;
  category: "withdrawal" | "advance" | "expense" | "other";
  notes: string;
};

const makeRow = (): EntryRow => ({ personName: "", amount: "", category: "withdrawal", notes: "" });

function formatDateShort(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short",
  });
}

export function ExpenseClient({
  entries,
  isOwner,
  viewingDate,
  canDelete,
  previousGroups,
}: {
  entries: CashExpense[];
  isOwner: boolean;
  viewingDate: string;
  canDelete?: boolean;
  previousGroups?: { date: string; entries: CashExpense[] }[];
}) {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const isToday = viewingDate === today;
  const router = useRouter();

  // ── Multi-row form state (today view) ──────────────────────────────────
  const [rows, setRows] = useState<EntryRow[]>([makeRow()]);
  const [submitting, setSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // ── Single-entry form (past date view) ─────────────────────────────────
  const [singleState, singleFormAction] = useFormState<ExpenseFormState, FormData>(addCashExpense, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (singleState.error) toast.error(singleState.error);
    if (singleState.ok) {
      toast.success("Cash expense logged ✓");
      setShowConfetti(true);
      formRef.current?.reset();
      router.refresh();
    }
  }, [singleState]);

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const d = e.target.value;
    if (d === today) {
      router.push("/sales?tab=expenses");
    } else {
      router.push(`/sales?tab=expenses&date=${d}`);
    }
  }

  async function handleMultiSubmit() {
    const validRows = rows.filter((r) => r.personName.trim() && r.amount);
    if (!validRows.length) {
      toast.error("Please fill at least one entry with a name and amount.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await addMultipleCashExpenses(
        validRows.map((r) => ({
          person_name: r.personName.trim(),
          amount: r.amount,
          category: r.category,
          notes: r.notes.trim(),
        })),
        viewingDate,
      );
      if (result.error) {
        toast.error(result.error);
      } else {
        const label = validRows.length === 1 ? "Cash expense" : `${validRows.length} entries`;
        toast.success(`${label} logged ✓`);
        setShowConfetti(true);
        setRows([makeRow()]);
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  const total = entries.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <>
      <Confetti active={showConfetti} />

      {/* ── Date picker ──────────────────────────────────────────────────── */}
      <div className="relative flex items-center gap-3 rounded-xl border border-border bg-bg-elevated px-4 py-3.5 cursor-pointer">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-fire/15">
          <CalendarDays className="size-4 text-fire" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-content-secondary">
            Cash out entry date
          </p>
          <p className="text-sm font-bold text-content-primary mt-0.5">
            {isToday
              ? "Today"
              : new Date(viewingDate + "T00:00:00").toLocaleDateString("en-IN", {
                  weekday: "short", day: "numeric", month: "short", year: "numeric",
                })}
          </p>
        </div>
        <span className="text-xs font-semibold text-fire px-3 py-1.5 rounded-lg bg-fire/10 shrink-0">
          Change
        </span>
        <input
          type="date"
          value={viewingDate}
          max={today}
          onChange={handleDateChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      {isToday ? (
        /* ── Multi-row form ────────────────────────────────────────────── */
        <>
          <Card className="overflow-hidden divide-y divide-border">
            {rows.map((row, i) => (
              <div key={i} className="p-4 space-y-2.5">
                {/* Row header */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-content-secondary">
                    Entry {rows.length > 1 ? i + 1 : ""}
                  </span>
                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setRows((r) => r.filter((_, idx) => idx !== i))}
                      className="text-content-secondary hover:text-danger transition-colors"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>

                {/* Person / Purpose */}
                <Input
                  placeholder="Person / Purpose"
                  value={row.personName}
                  onChange={(e) =>
                    setRows((r) => r.map((x, idx) => idx === i ? { ...x, personName: e.target.value } : x))
                  }
                />

                {/* Amount + Type */}
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="1"
                    step="0.01"
                    placeholder="Amount (₹)"
                    value={row.amount}
                    onChange={(e) =>
                      setRows((r) => r.map((x, idx) => idx === i ? { ...x, amount: e.target.value } : x))
                    }
                    className="font-mono"
                  />
                  <select
                    value={row.category}
                    onChange={(e) =>
                      setRows((r) =>
                        r.map((x, idx) =>
                          idx === i
                            ? { ...x, category: e.target.value as EntryRow["category"] }
                            : x,
                        ),
                      )
                    }
                    className="h-10 w-full rounded-lg border border-border bg-bg-elevated px-2.5 text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-fire/40"
                  >
                    <option value="withdrawal">Withdrawal</option>
                    <option value="advance">Advance</option>
                    <option value="expense">Expense</option>
                    <option value="other">Other</option>
                    <option value="deposit">Deposit ↑</option>
                  </select>
                </div>

                {/* Notes */}
                <Input
                  placeholder="Notes (optional)"
                  value={row.notes}
                  onChange={(e) =>
                    setRows((r) => r.map((x, idx) => idx === i ? { ...x, notes: e.target.value } : x))
                  }
                />
              </div>
            ))}

            {/* Add more button */}
            <button
              type="button"
              onClick={() => setRows((r) => [...r, makeRow()])}
              className="flex w-full items-center justify-center gap-2 py-3.5 text-sm font-semibold text-content-secondary hover:text-content-primary hover:bg-bg-elevated/60 transition-colors"
            >
              <Plus className="size-4" />
              Add another cashout
            </button>
          </Card>

          {/* Submit */}
          <button
            type="button"
            onClick={handleMultiSubmit}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <ArrowDownLeft className="size-4" />
            {submitting ? "Logging…" : "Log Cash Out"}
          </button>

          {/* Today's entries */}
          {entries.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-danger/10 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-danger">
                  <Wallet className="size-4" />
                  Total cash out today
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
            <div className="flex flex-col items-center gap-2 py-8 text-center text-content-secondary">
              <IndianRupee className="size-7 opacity-30" />
              <p className="text-sm">No cash out logged today yet.</p>
            </div>
          )}

          {/* Previous days accordion */}
          {previousGroups && previousGroups.length > 0 && (
            <PreviousDaysAccordion groups={previousGroups} isOwner={isOwner} />
          )}
        </>
      ) : (
        /* ── Past date: single entry form ──────────────────────────────── */
        <>
          <form ref={formRef} action={singleFormAction} className="space-y-4">
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
                    <option value="deposit">Deposit ↑</option>
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

          {entries.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-danger/10 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-danger">
                  <Wallet className="size-4" />
                  Total cash out
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
              <p className="text-sm">No cash expenses logged for this date.</p>
            </div>
          )}
        </>
      )}
    </>
  );
}

/* ── Previous days accordion ──────────────────────────────────────────── */
function PreviousDaysAccordion({
  groups,
  isOwner,
}: {
  groups: { date: string; entries: CashExpense[] }[];
  isOwner: boolean;
}) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-content-secondary">
        Previous days
      </p>
      <div className="space-y-2">
        {groups.map(({ date, entries }) => {
          const dayTotal = entries.reduce((s, e) => s + Number(e.amount), 0);
          const isOpen = open === date;
          return (
            <Card key={date} className="overflow-hidden">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : date)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-bg-elevated/40 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-content-primary">{formatDateShort(date)}</p>
                  <p className="text-xs text-content-secondary">
                    {entries.length} {entries.length === 1 ? "entry" : "entries"}
                  </p>
                </div>
                <span className="font-mono text-sm font-bold tabular-nums text-danger shrink-0">
                  -{formatINR(dayTotal)}
                </span>
                {isOpen ? (
                  <ChevronDown className="size-4 text-content-secondary shrink-0" />
                ) : (
                  <ChevronRight className="size-4 text-content-secondary shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="divide-y divide-border border-t border-border">
                  {entries.map((entry) => (
                    <PrevDayRow key={entry.id} entry={entry} isOwner={isOwner} />
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function PrevDayRow({ entry, isOwner }: { entry: CashExpense; isOwner: boolean }) {
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
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata",
  });

  return (
    <>
      <Confetti active={showConfetti} />
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-content-primary">{personName}</p>
          <p className="text-xs text-content-secondary">
            <span className={CATEGORY_COLORS[category] ?? "text-content-secondary"}>
              {CATEGORY_LABELS_SHORT[category] ?? category}
            </span>
            {notes && <> · {notes}</>}
            <span className="ml-1 opacity-60">· {time}</span>
          </p>
        </div>
        <span className={`shrink-0 font-mono text-sm font-bold tabular-nums ${category === "deposit" ? "text-green-400" : "text-danger"}`}>
          {category === "deposit" ? "+" : "-"}{formatINR(Number(amount))}
        </span>
        {isOwner && (
          <>
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className={`rounded-lg p-1.5 transition-colors ${
                editing
                  ? "bg-fire/15 text-fire"
                  : "text-content-secondary hover:bg-bg-elevated hover:text-content-primary"
              }`}
            >
              {editing ? <X className="size-4" /> : <Pencil className="size-3.5" />}
            </button>
            <form action={deleteAction}>
              <input type="hidden" name="id" value={entry.id} />
              <button
                type="submit"
                className="rounded-lg p-1.5 text-content-secondary transition-colors hover:bg-danger/10 hover:text-danger"
              >
                <Trash2 className="size-4" />
              </button>
            </form>
          </>
        )}
      </div>
      {editing && (
        <form action={editFormAction} className="border-t border-border/60 bg-bg-elevated/40 px-4 py-3 space-y-2.5">
          <input type="hidden" name="id" value={entry.id} />
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-content-secondary">
                Person / Purpose
              </label>
              <Input name="person_name" value={personName} onChange={(e) => setPersonName(e.target.value)} className="h-9 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-content-secondary">
                Amount (₹)
              </label>
              <Input name="amount" type="number" inputMode="decimal" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-9 font-mono text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-content-secondary">
                Type
              </label>
              <select name="category" value={category} onChange={(e) => setCategory(e.target.value as EntryRow["category"])} className="h-9 w-full rounded-lg border border-border bg-bg-elevated px-2.5 text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-fire/40">
                <option value="withdrawal">Withdrawal</option>
                <option value="advance">Advance</option>
                <option value="expense">Expense</option>
                <option value="other">Other</option>
                <option value="deposit">Deposit ↑</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-content-secondary">Notes</label>
              <Input name="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional note" className="h-9 text-sm" />
            </div>
          </div>
          <div className="flex gap-2 pt-0.5">
            <button type="button" onClick={() => setEditing(false)} className="flex-1 rounded-lg border border-border bg-bg-elevated py-2 text-xs font-semibold text-content-secondary transition-colors hover:text-content-primary">
              Cancel
            </button>
            <button type="submit" className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white py-2 text-xs font-bold text-black transition-opacity hover:opacity-90">
              <Check className="size-3.5" strokeWidth={3} /> Save changes
            </button>
          </div>
        </form>
      )}
    </>
  );
}

/* ── Today's expense row (with edit/delete) ─────────────────────────── */
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
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata",
  });

  const withinTwoHours = Date.now() - new Date(entry.submitted_at).getTime() < 2 * 60 * 60 * 1000;
  const showDelete = isOwner || (canDelete && withinTwoHours);

  return (
    <>
      <Confetti active={showConfetti} />
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
        <span className={`shrink-0 font-mono text-base font-bold tabular-nums ${category === "deposit" ? "text-green-400" : "text-danger"}`}>
          {category === "deposit" ? "+" : "-"}{formatINR(Number(amount))}
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

      {editing && (
        <form action={editFormAction} className="border-t border-border/60 bg-bg-elevated/40 px-4 py-3 space-y-2.5">
          <input type="hidden" name="id" value={entry.id} />
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-content-secondary">
                Person / Purpose
              </label>
              <Input name="person_name" value={personName} onChange={(e) => setPersonName(e.target.value)} placeholder="Name or purpose" className="h-9 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-content-secondary">
                Amount (₹)
              </label>
              <Input name="amount" type="number" inputMode="decimal" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-9 font-mono text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-content-secondary">
                Type
              </label>
              <select name="category" value={category} onChange={(e) => setCategory(e.target.value as "withdrawal" | "advance" | "expense" | "other" | "deposit")} className="h-9 w-full rounded-lg border border-border bg-bg-elevated px-2.5 text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-fire/40">
                <option value="withdrawal">Withdrawal</option>
                <option value="advance">Advance</option>
                <option value="expense">Expense</option>
                <option value="other">Other</option>
                <option value="deposit">Deposit ↑</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-content-secondary">Notes</label>
              <Input name="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional note" className="h-9 text-sm" />
            </div>
          </div>
          <div className="flex gap-2 pt-0.5">
            <button type="button" onClick={() => setEditing(false)} className="flex-1 rounded-lg border border-border bg-bg-elevated py-2 text-xs font-semibold text-content-secondary transition-colors hover:text-content-primary">
              Cancel
            </button>
            <button type="submit" className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white py-2 text-xs font-bold text-black transition-opacity hover:opacity-90">
              <Check className="size-3.5" strokeWidth={3} /> Save changes
            </button>
          </div>
        </form>
      )}
    </>
  );
}
