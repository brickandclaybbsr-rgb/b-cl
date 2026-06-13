import Link from "next/link";
import { ArrowLeft, Wallet, TrendingDown, UserCheck, ShoppingBag, MoreHorizontal } from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { getRecentCashExpenses } from "@/lib/data/expenses";
import { deleteCashExpense } from "@/app/(app)/expenses/actions";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
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

  // ── Aggregate stats ─────────────────────────────────────────────────
  const total      = entries.reduce((s, e) => s + Number(e.amount), 0);
  const byCategory = { withdrawal: 0, advance: 0, expense: 0, other: 0 };
  for (const e of entries) {
    byCategory[e.category] = (byCategory[e.category] ?? 0) + Number(e.amount);
  }

  // ── By person ───────────────────────────────────────────────────────
  const byPerson: Record<string, { total: number; category: string; count: number }> = {};
  for (const e of entries) {
    const key = e.person_name;
    if (!byPerson[key]) byPerson[key] = { total: 0, category: e.category, count: 0 };
    byPerson[key].total += Number(e.amount);
    byPerson[key].count += 1;
  }
  const personRows = Object.entries(byPerson)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10);

  // ── By date ─────────────────────────────────────────────────────────
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
    withdrawal: "Withdrawals", advance: "Advances",
    expense: "Expenses", other: "Other",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cash Out"
        subtitle="Last 30 days"
        action={
          <Link href="/owner" className="flex items-center gap-1.5 text-sm font-semibold text-content-secondary hover:text-content-primary">
            <ArrowLeft className="size-4" /> Back
          </Link>
        }
      />

      {/* ── Summary stat cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4">
          <div className="mb-2 flex size-8 items-center justify-center rounded-lg bg-danger/10 text-danger">
            <Wallet className="size-4" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-content-secondary">Total Out</p>
          <p className="mt-0.5 font-mono text-lg font-bold tabular-nums text-danger">{formatINR(total)}</p>
        </Card>
        <Card className="p-4">
          <div className="mb-2 flex size-8 items-center justify-center rounded-lg bg-danger/10 text-danger">
            <TrendingDown className="size-4" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-content-secondary">Withdrawals</p>
          <p className="mt-0.5 font-mono text-lg font-bold tabular-nums">{formatINR(byCategory.withdrawal)}</p>
        </Card>
        <Card className="p-4">
          <div className="mb-2 flex size-8 items-center justify-center rounded-lg bg-warning/10 text-warning">
            <UserCheck className="size-4" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-content-secondary">Advances</p>
          <p className="mt-0.5 font-mono text-lg font-bold tabular-nums">{formatINR(byCategory.advance)}</p>
        </Card>
        <Card className="p-4">
          <div className="mb-2 flex size-8 items-center justify-center rounded-lg bg-warm/10 text-warm">
            <ShoppingBag className="size-4" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-content-secondary">Expenses</p>
          <p className="mt-0.5 font-mono text-lg font-bold tabular-nums">{formatINR(byCategory.expense + byCategory.other)}</p>
        </Card>
      </div>

      {/* ── Category bar ────────────────────────────────────────────── */}
      {total > 0 && (
        <Card className="p-4">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-content-secondary">Category split</h2>
          <div className="space-y-2.5">
            {(["withdrawal", "advance", "expense", "other"] as const).map((cat) => {
              const amt = byCategory[cat];
              if (!amt) return null;
              const pct = Math.round((amt / total) * 100);
              return (
                <div key={cat}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className={`font-semibold ${CATEGORY_COLOR[cat]}`}>{CATEGORY_LABEL[cat]}</span>
                    <span className="font-mono tabular-nums">{formatINR(amt)} · {pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-bg-elevated">
                    <div
                      className={`h-full rounded-full ${cat === "withdrawal" ? "bg-danger" : cat === "advance" ? "bg-warning" : cat === "expense" ? "bg-warm" : "bg-content-secondary"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── By person breakdown ─────────────────────────────────────── */}
      {personRows.length > 0 && (
        <Card className="overflow-hidden p-4">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-content-secondary">By person (top 10)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wider text-content-secondary">
                  <th className="pb-2">Person</th>
                  <th className="pb-2 text-center">Entries</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {personRows.map(([name, data]) => (
                  <tr key={name} className="transition-colors hover:bg-bg-elevated/50">
                    <td className="py-2.5">
                      <span className="font-semibold">{name}</span>
                      <span className={`ml-2 text-xs ${CATEGORY_COLOR[data.category]}`}>
                        {CATEGORY_LABEL[data.category]}
                      </span>
                    </td>
                    <td className="py-2.5 text-center text-xs text-content-secondary">{data.count}</td>
                    <td className="py-2.5 text-right font-mono font-bold tabular-nums text-danger">
                      {formatINR(data.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Daily log ───────────────────────────────────────────────── */}
      <div>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-content-secondary">Daily log</h2>
        {Object.keys(byDate).length === 0 ? (
          <p className="py-10 text-center text-sm text-content-secondary">No cash out entries yet.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(byDate).map(([date, dayEntries]) => {
              const dayTotal = dayEntries.reduce((s, e) => s + Number(e.amount), 0);
              return (
                <div key={date}>
                  <div className="mb-1.5 flex items-center justify-between px-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-content-secondary">
                      {dateLabel(date)}
                    </span>
                    <span className="font-mono text-xs font-bold text-danger">
                      -{formatINR(dayTotal)}
                    </span>
                  </div>
                  <Card className="divide-y divide-border overflow-hidden">
                    <CashOutList entries={dayEntries} deleteAction={deleteCashExpense} />
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
