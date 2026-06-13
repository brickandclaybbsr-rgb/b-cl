import Link from "next/link";
import { MessageCircle, CalendarDays, Wallet, TrendingDown, UserCheck, ShoppingBag, ChevronRight } from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { getRecentDays, getEodLog } from "@/lib/data/reports";
import { getSalesTrend } from "@/lib/data/sales";
import { getRecentCashExpenses } from "@/lib/data/expenses";
import { formatDateLabel, formatTimestampIST } from "@/lib/date";
import { formatINR } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
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

  // Cash out aggregates
  const cashTotal = cashEntries.reduce((s, e) => s + Number(e.amount), 0);
  const cashByCategory = { withdrawal: 0, advance: 0, expense: 0, other: 0 } as Record<string, number>;
  for (const e of cashEntries) cashByCategory[e.category] = (cashByCategory[e.category] ?? 0) + Number(e.amount);
  // Top 5 by person
  const cashByPerson: Record<string, number> = {};
  for (const e of cashEntries) cashByPerson[e.person_name] = (cashByPerson[e.person_name] ?? 0) + Number(e.amount);
  const topPersons = Object.entries(cashByPerson).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="Last 14 days" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-content-secondary">
            14-day sales
          </p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-warm">
            {formatINR(periodTotal)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-content-secondary">
            Avg sales / day
          </p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums">
            {formatINR(withSales.length ? periodTotal / withSales.length : 0)}
          </p>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="mb-1 text-sm font-bold uppercase tracking-wider text-content-secondary">
          Last 7 days
        </h2>
        <SalesTrendChart data={trend} />
      </Card>

      {/* Daily breakdown */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-content-secondary">
          <CalendarDays className="size-4" /> Daily breakdown
          <span className="text-[10px] font-normal text-content-secondary normal-case tracking-normal">— tap a day for full platform detail</span>
        </h2>
        <DailyList days={days} />
      </div>

      {/* Cash Out summary */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-content-secondary">
            <Wallet className="size-4" /> Cash Out (14 days)
          </h2>
          <Link href="/owner/cashout" className="flex items-center gap-1 text-xs font-semibold text-warm hover:underline">
            Full history <ChevronRight className="size-3" />
          </Link>
        </div>

        {/* Stat row */}
        <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Out",    icon: Wallet,      amt: cashTotal,                                   color: "text-danger",  bg: "bg-danger/10"  },
            { label: "Withdrawals",  icon: TrendingDown, amt: cashByCategory.withdrawal,                  color: "text-danger",  bg: "bg-danger/10"  },
            { label: "Advances",     icon: UserCheck,   amt: cashByCategory.advance,                      color: "text-warning", bg: "bg-warning/10" },
            { label: "Expenses",     icon: ShoppingBag, amt: cashByCategory.expense + cashByCategory.other, color: "text-warm",  bg: "bg-warm/10"    },
          ].map(({ label, icon: Icon, amt, color, bg }) => (
            <Card key={label} className="flex items-center gap-3 p-3">
              <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${bg} ${color}`}>
                <Icon className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-content-secondary">{label}</p>
                <p className={`font-mono text-sm font-bold tabular-nums ${color}`}>{formatINR(amt)}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Top recipients */}
        {topPersons.length > 0 && (
          <Card className="divide-y divide-border overflow-hidden">
            {topPersons.map(([name, amt]) => (
              <div key={name} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm font-medium">{name}</span>
                <span className="font-mono text-sm font-bold tabular-nums text-danger">-{formatINR(amt)}</span>
              </div>
            ))}
          </Card>
        )}

        {cashEntries.length === 0 && (
          <p className="py-4 text-center text-sm text-content-secondary">No cash out entries in the last 14 days.</p>
        )}
      </div>

      {/* EOD WhatsApp log */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-content-secondary">
          <MessageCircle className="size-4" /> EOD report log
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

