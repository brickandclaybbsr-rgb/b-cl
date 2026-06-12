import { Check, MessageCircle, CalendarDays } from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { getRecentDays, getEodLog } from "@/lib/data/reports";
import { getSalesTrend } from "@/lib/data/sales";
import { formatDateLabel, formatTimestampIST } from "@/lib/date";
import { formatINR, formatNumber } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { SalesTrendChart } from "@/components/charts/sales-trend-chart";

export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  await requireOwner();
  const [days, trend, log] = await Promise.all([
    getRecentDays(14),
    getSalesTrend(7),
    getEodLog(14),
  ]);

  const withSales = days.filter((d) => d.total > 0);
  const periodTotal = days.reduce((sum, d) => sum + d.total, 0);

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
        </h2>
        <Card className="divide-y divide-border">
          {days.map((d) => (
            <div key={d.date} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{formatDateLabel(d.date)}</p>
                <p className="text-xs text-content-secondary">
                  {d.hasSales ? "Sales recorded" : "No sales entry"}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Tick ok={d.openingDone} title="Opening" letter="O" />
                <Tick ok={d.closingDone} title="Closing" letter="C" />
              </div>
              <span className="w-24 text-right font-mono text-sm font-semibold tabular-nums">
                {formatINR(d.total)}
              </span>
            </div>
          ))}
        </Card>
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

function Tick({
  ok,
  title,
  letter,
}: {
  ok: boolean;
  title: string;
  letter: string;
}) {
  return (
    <span
      title={`${title}: ${ok ? "done" : "missing"}`}
      className={`flex size-6 items-center justify-center rounded-md text-[0.65rem] font-bold ${
        ok ? "bg-success/15 text-success" : "bg-bg-elevated text-content-secondary"
      }`}
    >
      {ok ? <Check className="size-3.5" strokeWidth={3} /> : letter}
    </span>
  );
}
