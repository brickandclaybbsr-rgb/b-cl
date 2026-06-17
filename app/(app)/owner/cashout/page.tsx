import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { getRecentCashExpenses } from "@/lib/data/expenses";
import { deleteCashExpense } from "@/app/(app)/expenses/actions";
import { Card } from "@/components/ui/card";
import { formatINR } from "@/lib/utils";
import { CashOutList } from "./cashout-list";
import type { CashExpense } from "@/lib/database.types";

export const metadata = { title: "Cash Out History" };

function dateLabel(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short",
  });
}

export default async function CashOutPage() {
  await requireOwner();
  const entries = await getRecentCashExpenses(30);

  const total = entries.reduce((s, e) => s + Number(e.amount), 0);
  const byCategory = { withdrawal: 0, advance: 0, expense: 0, other: 0 };
  for (const e of entries) {
    byCategory[e.category as keyof typeof byCategory] =
      (byCategory[e.category as keyof typeof byCategory] ?? 0) + Number(e.amount);
  }

  const byPerson: Record<string, { total: number; category: string; count: number }> = {};
  for (const e of entries) {
    if (!byPerson[e.person_name]) byPerson[e.person_name] = { total: 0, category: e.category, count: 0 };
    byPerson[e.person_name].total += Number(e.amount);
    byPerson[e.person_name].count += 1;
  }
  const personRows = Object.entries(byPerson).sort((a, b) => b[1].total - a[1].total).slice(0, 10);

  const byDate: Record<string, CashExpense[]> = {};
  for (const e of entries) {
    if (!byDate[e.date]) byDate[e.date] = [];
    byDate[e.date].push(e);
  }

  const CATEGORY_COLOR: Record<string, string> = {
    withdrawal: "text-danger", advance: "text-warning",
    expense: "text-warm", other: "text-content-secondary",
  };
  const CATEGORY_LABEL: Record<string, string> = {
    withdrawal: "Withdrawal", advance: "Advance",
    expense: "Expense", other: "Other",
  };

  return (
    <div className="space-y-4">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pb-1">
        <Link
          href="/owner"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-content-secondary transition-colors hover:bg-bg-elevated hover:text-content-primary"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Cash Out</h1>
          <p className="text-xs text-content-secondary">Last 30 days</p>
        </div>
      </div>

      {/* ── Hero card — total + 3 chips ──────────────────────────── */}
      {entries.length > 0 ? (
        <Card className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-content-secondary">Total out</p>
          <p className="mt-1 font-mono text-3xl font-bold tabular-nums text-danger">
            -{formatINR(total)}
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-bg-elevated px-2.5 py-2">
              <p className="text-[10px] text-content-secondary">Withdrawals</p>
              <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-danger">
                {formatINR(byCategory.withdrawal)}
              </p>
            </div>
            <div className="rounded-xl bg-bg-elevated px-2.5 py-2">
              <p className="text-[10px] text-content-secondary">Advances</p>
              <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-warning">
                {formatINR(byCategory.advance)}
              </p>
            </div>
            <div className="rounded-xl bg-bg-elevated px-2.5 py-2">
              <p className="text-[10px] text-content-secondary">Expenses</p>
              <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-warm">
                {formatINR(byCategory.expense + byCategory.other)}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <p className="py-10 text-center text-sm text-content-secondary">No cash out entries yet.</p>
      )}

      {/* ── Daily log ───────────────────────────────────────────────── */}
      {Object.keys(byDate).length > 0 && (
        <div>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-content-secondary">Daily log</h2>
          <div className="space-y-3">
            {Object.entries(byDate).map(([date, dayEntries]) => {
              const dayTotal = dayEntries.reduce((s, e) => s + Number(e.amount), 0);
              return (
                <div key={date}>
                  <div className="mb-1.5 flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-content-secondary">{dateLabel(date)}</span>
                    <span className="font-mono text-xs font-bold text-danger">-{formatINR(dayTotal)}</span>
                  </div>
                  <Card className="divide-y divide-border overflow-hidden">
                    <CashOutList entries={dayEntries} deleteAction={deleteCashExpense} />
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── By person — compact list ─────────────────────────────── */}
      {personRows.length > 0 && (
        <div>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-content-secondary">By person</h2>
          <Card className="divide-y divide-border overflow-hidden">
            {personRows.map(([name, data]) => (
              <div key={name} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">{name}</p>
                  <p className={`text-xs ${CATEGORY_COLOR[data.category] ?? "text-content-secondary"}`}>
                    {CATEGORY_LABEL[data.category] ?? data.category}
                    {" · "}{data.count} entr{data.count !== 1 ? "ies" : "y"}
                  </p>
                </div>
                <span className="font-mono text-sm font-bold tabular-nums text-danger">
                  -{formatINR(data.total)}
                </span>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}
