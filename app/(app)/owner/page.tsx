import Link from "next/link";
import {
  IndianRupee,
  Receipt,
  Package,
  ShoppingCart,
  Sunrise,
  Sunset,
  CheckCircle2,
  XCircle,
  Activity,
  ChevronRight,
  Wallet,
  AlertTriangle,
} from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { getTodaySnapshot } from "@/lib/data/dashboard";
import { getClosingChecklist } from "@/lib/data/checklists";
import { getSalesTrend, getSalesRange } from "@/lib/data/sales";
import { getTodayActivity } from "@/lib/data/activity";
import { getTodayCashExpenses } from "@/lib/data/expenses";
import { daysAgoIST, formatDateLabel, formatTimeIST } from "@/lib/date";
import { APP_START_DATE } from "@/lib/constants";
import { getProfileNameMap } from "@/lib/data/profiles";
import { formatINR, formatNumber } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { SalesTrendChart } from "@/components/charts/sales-trend-chart";
import { SendReportButton } from "@/components/send-report-button";

export const metadata = { title: "Dashboard" };

export default async function OwnerDashboard() {
  await requireOwner();
  const yesterday = daysAgoIST(1);

  const [snap, trend, activity, nameMap, cashExpenses, yKitchen, yFrontDesk] = await Promise.all([
    getTodaySnapshot(),
    getSalesTrend(7),
    getTodayActivity(),
    getProfileNameMap(),
    getTodayCashExpenses(),
    getClosingChecklist(yesterday, "kitchen"),
    getClosingChecklist(yesterday, "front_desk"),
  ]);

  const salesWindowRecords = await getSalesRange(APP_START_DATE, snap.date);

  const alerts = snap.lowItems.length + snap.outItems.length;

  const isFirstDay = snap.date === APP_START_DATE;
  const filedSalesDates = new Set(salesWindowRecords.map((s) => s.date));
  const missingSalesDates: string[] = [];
  for (let d = new Date(APP_START_DATE + "T00:00:00Z"); ; d.setUTCDate(d.getUTCDate() + 1)) {
    const str = d.toISOString().slice(0, 10);
    if (str > snap.date) break;
    if (!filedSalesDates.has(str)) missingSalesDates.push(str);
  }

  const cash = Number(snap.sales?.cash_sales ?? 0);
  const online = Number(snap.sales?.online_sales ?? 0);
  const agg = Number(snap.sales?.aggregator_sales ?? 0);

  const salesSubmitter = snap.sales?.submitted_by
    ? nameMap[snap.sales.submitted_by] ?? "Staff"
    : "Staff";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Owner Dashboard"
        subtitle={formatDateLabel(snap.date)}
        action={<SendReportButton size="sm" variant="secondary" />}
      />

      {/* Yesterday's closing alerts */}
      {!isFirstDay && (!yKitchen || !yFrontDesk) && (
        <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning space-y-1.5">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="size-4 shrink-0" />
            Yesterday&apos;s closing not filed
          </div>
          <div className="flex flex-wrap gap-2 pl-6">
            {!yKitchen && (
              <Link
                href={`/checklist/closing?date=${yesterday}`}
                className="rounded-lg border border-warning/40 bg-warning/15 px-2.5 py-1 text-xs font-semibold hover:bg-warning/25"
              >
                Kitchen — {formatDateLabel(yesterday)}
              </Link>
            )}
            {!yFrontDesk && (
              <Link
                href={`/checklist/closing?date=${yesterday}`}
                className="rounded-lg border border-warning/40 bg-warning/15 px-2.5 py-1 text-xs font-semibold hover:bg-warning/25"
              >
                Dining — {formatDateLabel(yesterday)}
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Missing sales dates */}
      {missingSalesDates.length > 0 && (
        <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning space-y-1.5">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="size-4 shrink-0" />
            Sales not filed for {missingSalesDates.length} day{missingSalesDates.length > 1 ? "s" : ""}
          </div>
          <div className="flex flex-wrap gap-2 pl-6">
            {missingSalesDates.map((d) => (
              <Link
                key={d}
                href={`/sales?date=${d}`}
                className="rounded-lg border border-warning/40 bg-warning/15 px-2.5 py-1 text-xs font-semibold hover:bg-warning/25"
              >
                {formatDateLabel(d)}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Overview cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Today's sales"
          value={formatINR(snap.salesTotal)}
          icon={IndianRupee}
          tone="fire"
          hint={
            snap.sales
              ? `By ${salesSubmitter} at ${formatTimeIST(snap.sales.submitted_at)}`
              : "Not entered yet"
          }
        />
        <StatCard
          label="Stock alerts"
          value={alerts}
          icon={Package}
          tone={alerts > 0 ? "warning" : "success"}
          hint={`${snap.outItems.length} out · ${snap.lowItems.length} low`}
        />
        <StatCard
          label="Pending orders"
          value={snap.pendingOrders}
          icon={ShoppingCart}
          tone={snap.pendingOrders > 0 ? "warning" : "success"}
          hint="awaiting action"
        />
      </div>

      {/* Checklist status — one card per team per shift */}
      <Card className="p-4">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-content-secondary">
          Checklists
        </h2>

        {/* Opening row */}
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-warm flex items-center gap-1.5">
          <Sunrise className="size-3" /> Opening
        </p>
        <div className="mb-4 grid grid-cols-2 gap-3">
          <ChecklistStatus
            label="Kitchen"
            done={Boolean(snap.openingKitchen)}
            time={snap.openingKitchen ? formatTimeIST(snap.openingKitchen.submitted_at) : null}
            submitterName={
              snap.openingKitchen?.submitted_by
                ? nameMap[snap.openingKitchen.submitted_by] ?? "Staff"
                : null
            }
          />
          <ChecklistStatus
            label="Dining"
            done={Boolean(snap.openingFrontDesk)}
            time={snap.openingFrontDesk ? formatTimeIST(snap.openingFrontDesk.submitted_at) : null}
            submitterName={
              snap.openingFrontDesk?.submitted_by
                ? nameMap[snap.openingFrontDesk.submitted_by] ?? "Staff"
                : null
            }
          />
        </div>

        {/* Closing row */}
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-warm flex items-center gap-1.5">
          <Sunset className="size-3" /> Closing
        </p>
        <div className="grid grid-cols-2 gap-3">
          <ChecklistStatus
            label="Kitchen"
            done={Boolean(snap.closingKitchen)}
            time={snap.closingKitchen ? formatTimeIST(snap.closingKitchen.submitted_at) : null}
            submitterName={
              snap.closingKitchen?.submitted_by
                ? nameMap[snap.closingKitchen.submitted_by] ?? "Staff"
                : null
            }
          />
          <ChecklistStatus
            label="Dining"
            done={Boolean(snap.closingFrontDesk)}
            time={snap.closingFrontDesk ? formatTimeIST(snap.closingFrontDesk.submitted_at) : null}
            submitterName={
              snap.closingFrontDesk?.submitted_by
                ? nameMap[snap.closingFrontDesk.submitted_by] ?? "Staff"
                : null
            }
          />
        </div>
      </Card>

      {/* Cash vs Online + 7-day trend */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-content-secondary">
            Cash vs Online (today)
          </h2>
          {snap.salesTotal > 0 ? (
            <div className="space-y-2.5">
              <SplitBar label="Cash" value={cash} total={snap.salesTotal} color="#FFFFFF" />
              <SplitBar label="Online" value={online} total={snap.salesTotal} color="#9A9AA2" />
              <SplitBar label="Swiggy/Zomato" value={agg} total={snap.salesTotal} color="#4D4D55" />
            </div>
          ) : (
            <p className="py-4 text-sm text-content-secondary">No sales recorded yet.</p>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="mb-1 text-sm font-bold uppercase tracking-wider text-content-secondary">
            Last 7 days
          </h2>
          <SalesTrendChart data={trend} />
        </Card>
      </div>

      {/* Activity */}
      <Card className="p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-content-secondary">
          <Activity className="size-4" /> Today&apos;s activity
        </h2>
        {activity.length === 0 ? (
          <p className="py-4 text-sm text-content-secondary">No activity yet today.</p>
        ) : (
          <ul className="space-y-3">
            {activity.map((e, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-fire" />
                <div className="flex-1">
                  <span className="font-medium">{e.actor}</span>{" "}
                  <span className="text-content-secondary">{e.action}</span>
                </div>
                <span className="shrink-0 text-xs text-content-secondary">
                  {formatTimeIST(e.at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Cash Expenses */}
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-content-secondary">
            <Wallet className="size-4" /> Cash Out Today
          </h2>
          <div className="flex items-center gap-3">
            {cashExpenses.length > 0 && (
              <span className="font-mono text-sm font-bold text-danger">
                -{formatINR(cashExpenses.reduce((s, e) => s + Number(e.amount), 0))}
              </span>
            )}
            <Link href="/owner/cashout" className="text-xs font-semibold text-warm hover:underline">
              View all
            </Link>
          </div>
        </div>
        {cashExpenses.length === 0 ? (
          <p className="py-2 text-sm text-content-secondary">No cash expenses logged today.</p>
        ) : (
          <ul className="divide-y divide-border">
            {cashExpenses.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0 flex-1">
                  <span className="font-medium">{e.person_name}</span>
                  {e.notes && <span className="ml-1.5 text-xs text-content-secondary">· {e.notes}</span>}
                </div>
                <span className="shrink-0 font-mono font-semibold tabular-nums text-danger">
                  -{formatINR(Number(e.amount))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <QuickAction href="/stock" icon={Package} label="Stock status" />
        <QuickAction href="/vendors" icon={ShoppingCart} label="Vendor orders" />
        <QuickAction href="/reports" icon={Receipt} label="Reports" />
      </div>
    </div>
  );
}

function ChecklistStatus({
  label,
  done,
  time,
  submitterName,
}: {
  label: string;
  done: boolean;
  time: string | null;
  submitterName?: string | null;
}) {
  return (
    <div
      className={`rounded-xl border bg-bg-elevated p-3 transition-colors ${
        done ? "border-success/30" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{label}</p>
        {done ? (
          <CheckCircle2 className="size-4 text-success" />
        ) : (
          <XCircle className="size-4 text-danger" />
        )}
      </div>
      <p className="mt-1 text-xs text-content-secondary font-mono">
        {done ? time : "Pending"}
      </p>
      {done && submitterName && (
        <p className="mt-1 text-[11px] font-medium text-warm truncate">
          By {submitterName}
        </p>
      )}
    </div>
  );
}

function SplitBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-content-secondary">{label}</span>
        <span className="font-mono tabular-nums">
          {formatINR(value)} · {pct}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-bg-elevated">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}


function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Package;
  label: string;
}) {
  return (
    <Link href={href}>
      <Card className="flex items-center gap-3 p-4 transition-colors hover:border-border-strong">
        <div className="flex size-9 items-center justify-center rounded-xl bg-fire/15 text-fire">
          <Icon className="size-4" />
        </div>
        <span className="flex-1 text-sm font-semibold">{label}</span>
        <ChevronRight className="size-4 text-content-secondary" />
      </Card>
    </Link>
  );
}
