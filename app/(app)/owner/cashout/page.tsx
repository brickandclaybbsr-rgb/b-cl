import Link from "next/link";
import { ArrowLeft, Wallet } from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { getRecentCashExpenses } from "@/lib/data/expenses";
import { deleteCashExpense } from "@/app/(app)/expenses/actions";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { formatINR } from "@/lib/utils";
import { CashOutList } from "./cashout-list";

export const metadata = { title: "Cash Out History" };

export default async function CashOutPage() {
  await requireOwner();
  const entries = await getRecentCashExpenses(30);

  // Group by date
  const byDate: Record<string, typeof entries> = {};
  for (const e of entries) {
    if (!byDate[e.date]) byDate[e.date] = [];
    byDate[e.date].push(e);
  }

  const grandTotal = entries.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Cash Out History"
        subtitle="Last 30 days · tap trash to delete an entry"
        action={
          <Link
            href="/owner"
            className="flex items-center gap-1.5 text-sm font-semibold text-content-secondary hover:text-content-primary"
          >
            <ArrowLeft className="size-4" /> Back
          </Link>
        }
      />

      {/* Grand total banner */}
      <div className="flex items-center justify-between rounded-xl bg-danger/10 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-danger">
          <Wallet className="size-4" /> Total (30 days)
        </div>
        <span className="font-mono text-xl font-bold tabular-nums text-danger">
          {formatINR(grandTotal)}
        </span>
      </div>

      {Object.keys(byDate).length === 0 ? (
        <p className="py-10 text-center text-sm text-content-secondary">No cash out entries yet.</p>
      ) : (
        <div className="space-y-4">
          {Object.entries(byDate).map(([date, dayEntries]) => {
            const dayTotal = dayEntries.reduce((s, e) => s + Number(e.amount), 0);
            const label = new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
              weekday: "short",
              day: "numeric",
              month: "short",
            });
            return (
              <div key={date}>
                <div className="mb-1.5 flex items-center justify-between px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-content-secondary">
                    {label}
                  </span>
                  <span className="font-mono text-xs font-semibold text-danger">
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
  );
}
