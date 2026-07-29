import Link from "next/link";
import {
  MessageCircle,
  CalendarDays,
  Wallet,
  TrendingDown,
  UserCheck,
  ShoppingBag,
  TrendingUp,
  LineChart,
  ClipboardCheck,
} from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { getRecentDays, getEodLog } from "@/lib/data/reports";
import { getSalesTrend } from "@/lib/data/sales";
import { getRecentCashExpenses } from "@/lib/data/expenses";
import { formatDateLabel, formatTimestampIST } from "@/lib/date";
import { formatINR } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { SalesTrendChart } from "@/components/charts/sales-trend-chart";
import { DailyList } from "@/components/reports/daily-list";

export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  await requireOwner();
  const [days, trend, log, cashEntries] = await Promise.all([
    getRecentDays(14),
    getSalesTrend(7),
    getEodLog(14),
    getRecentCashExpenses(14),
  ]);

  const withSales = days.filter((d) => d.total > 0);
  const periodTotal = days.reduce((sum, d) => sum + d.total, 0);

  const cashTotal = cashEntries.reduce((s, e) => s + Number(e.amount), 0);
  const cashByCategory = { withdrawal: 0, advance: 0, expense: 0, other: 0 } as Record<string, number>;
  for (const e of cashEntries) cashByCategory[e.category] = (cashByCategory[e.category] ?? 0) + Number(e.amount);

  const cashByPerson: Record<string, number> = {};
  for (const e of cashEntries) cashByPerson[e.person_name] = (cashByPerson[e.person_name] ?? 0) + Number(e.amount);
  const topPersons = Object.entries(cashByPerson).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="space-y-4">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-1">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Reports</h1>
          <p className="text-xs text-content-secondary mt-0.5">Last 14 days</p>
        </div>
        <Link
          href="/owner/closing-balance"
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-content-secondary transition-colors hover:border-white/30 hover:text-content-primary"
        >
          <Wallet className="size-3.5" /> Closing Balance Report
        </Link>
      </div>

      {/* ── Tab switcher — pill style ──────────────────────────────────── */}
      <div className="flex gap-1 rounded-xl bg-bg-elevated p-1">
        <Link
          href="/reports"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-bg-card py-2 text-sm font-semibold text-white shadow-sm"
        >
          <LineChart className="size-4" /> Reports
        </Link>
        <Link
          href="/checklist/opening"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold text-content-secondary transition-colors hover:text-content-primary"
        >
          <ClipboardCheck className="size-4" /> Checklist
        </Link>
      </div>

      {/* ── KPI chips ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-content-secondary">14-day sales</p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-warm">
            {formatINR(periodTotal)}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-content-secondary">Daily average</p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums">
            {formatINR(withSales.length ? periodTotal / withSales.length : 0)}
          </p>
        </Card>
      </div>

      {/* ── 7-day trend ───────────────────────────────────────────────── */}
      <Card className="p-3">
        <div className="mb-1 flex items-center gap-1.5">
          <TrendingUp className="size-3.5 text-content-secondary" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-content-secondary">7-day trend</h2>
        </div>
        <SalesTrendChart data={trend} />
      </Card>

      {/* ── Daily breakdown ───────────────────────────────────────────── */}
      <div>
        <h2 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-content-secondary">
          <CalendarDays className="size-3.5" /> Daily breakdown
          <span className="ml-1 text-[10px] font-normal normal-case tracking-normal text-content-secondary/60">
            tap a day for details
          </span>
        </h2>
        <DailyList days={days} />
      </div>

      {/* ── Cash Out summary ──────────────────────────────────────────── */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-content-secondary">
            <Wallet className="size-3.5" /> Cash Out (14 days)
          </h2>
          <Link href="/owner/cashout" className="text-[11px] font-semibold text-warm">
            Full history →
          </Link>
        </div>

        {cashEntries.length > 0 ? (
          <>
            <div className="mb-3 grid grid-cols-2 gap-2">
              {[
                { label: "Total Out",   amt: cashTotal,                                      color: "text-danger"  },
                { label: "Withdrawals", amt: cashByCategory.withdrawal,                      color: "text-danger"  },
                { label: "Advances",    amt: cashByCategory.advance,                         color: "text-warning" },
                { label: "Expenses",    amt: cashByCategory.expense + cashByCategory.other,  color: "text-warm"    },
              ].map(({ label, amt, color }) => (
                <Card key={label} className="p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-content-secondary">{label}</p>
                  <p className={`mt-1 font-mono text-base font-bold tabular-nums ${color}`}>{formatINR(amt)}</p>
                </Card>
              ))}
            </div>

            {topPersons.length > 0 && (
              <Card className="divide-y divide-border overflow-hidden">
                {topPersons.map(([name, amt]) => (
                  <div key={name} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-sm font-medium">{name}</span>
                    <span className="font-mono text-sm font-bold tabular-nums text-danger">
                      -{formatINR(amt)}
                    </span>
                  </div>
                ))}
              </Card>
            )}
          </>
        ) : (
          <p className="py-3 text-center text-xs text-content-secondary">
            No cash out entries in the last 14 days.
          </p>
        )}
      </div>

      {/* ── EOD WhatsApp log ──────────────────────────────────────────── */}
      <div>
        <h2 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-content-secondary">
          <MessageCircle className="size-3.5" /> EOD report log
        </h2>
        {log.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="No reports sent yet"
            description="The daily WhatsApp report log will appear here once it runs."
          />
        ) : (
          <Card className="divide-y divide-border">
            {log.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{formatDateLabel(r.date)}</p>
                  <p className="text-xs text-content-secondary">
                    {formatTimestampIST(r.sent_at)}
                    {r.sent_to ? ` · ${r.sent_to}` : ""}
                  </p>
                </div>
                <Badge variant={r.status === "sent" ? "success" : "danger"}>
                  {r.status}
                </Badge>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
