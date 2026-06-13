"use client";

import { useEffect } from "react";
import { useFormState } from "react-dom";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { formatINR } from "@/lib/utils";
import type { CashExpense } from "@/lib/database.types";
import type { ExpenseFormState } from "@/app/(app)/expenses/actions";

const CATEGORY_LABELS: Record<string, string> = {
  withdrawal: "Withdrawal",
  advance:    "Advance",
  expense:    "Expense",
  other:      "Other",
};

const CATEGORY_COLORS: Record<string, string> = {
  withdrawal: "text-danger",
  advance:    "text-warning",
  expense:    "text-warm",
  other:      "text-content-secondary",
};

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
        <DeleteRow key={entry.id} entry={entry} deleteAction={deleteAction} />
      ))}
    </>
  );
}

function DeleteRow({
  entry,
  deleteAction,
}: {
  entry: CashExpense;
  deleteAction: (prev: ExpenseFormState, formData: FormData) => Promise<ExpenseFormState>;
}) {
  const [state, formAction] = useFormState<ExpenseFormState, FormData>(deleteAction, {});

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state]);

  const time = new Date(entry.submitted_at).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-content-primary">{entry.person_name}</p>
        <p className="text-xs text-content-secondary">
          <span className={CATEGORY_COLORS[entry.category] ?? "text-content-secondary"}>
            {CATEGORY_LABELS[entry.category] ?? entry.category}
          </span>
          {entry.notes && <> · {entry.notes}</>}
          <span className="ml-1 opacity-60">· {time}</span>
        </p>
      </div>
      <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-danger">
        -{formatINR(Number(entry.amount))}
      </span>
      <form action={formAction}>
        <input type="hidden" name="id" value={entry.id} />
        <button
          type="submit"
          className="ml-1 rounded-lg p-1.5 text-content-secondary transition-colors hover:bg-danger/10 hover:text-danger"
          title="Delete"
        >
          <Trash2 className="size-4" />
        </button>
      </form>
    </div>
  );
}
