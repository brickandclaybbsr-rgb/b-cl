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
  Users,
  Activity,
  ChevronRight,
} from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { getTodaySnapshot } from "@/lib/data/dashboard";
import { getSalesTrend } from "@/lib/data/sales";
import { getTodayActivity } from "@/lib/data/activity";
import { formatDateLabel, formatTimeIST } from "@/lib/date";
import { getProfileNameMap } from "@/lib/data/profiles";
import { formatINR, formatNumber } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { SalesTrendChart } from "@/components/charts/sales-trend-chart";
import { SendReportButton } from "@/components/send-report-button";

export const metadata = { title: "Dashboard" };

export default async function OwnerDashboard() {
  await requireOwner();
  const [snap, trend, activity, nameMap] = await Promise.all([
    getTodaySnapshot(),
    getSalesTrend(7),
    getTodayActivity(),
    getProfileNameMap(),
  ]);

  const alerts = snap.lowItems.length + snap.outItems.length;
  const avg = snap.sales && snap.sales.total_bills > 0
    ? snap.salesTotal / snap.sales.total_bills
    : 0;

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

      {/* Overview cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Today's sales"
          value={formatINR(snap.salesTotal)}
          icon={IndianRupee}
          tone="fire"
          hint={
            snap.sales
              ? `${formatNumber(snap.sales.total_bills)} bills · By ${salesSubmitter} at ${formatTimeIST(snap.sales.submitted_at)}`
              : "Not entered yet"
          }
        />
        <StatCard
          label="Avg bill"
          value={formatINR(avg)}
          icon={Receipt}
          hint={snap.sales ? "per cover" : "—"}
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

      {/* Checklist status + cash split */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-content-secondary">
            Checklists
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <ChecklistStatus
              icon={Sunrise}
              label="Opening"
              done={Boolean(snap.opening)}
              time={snap.opening ? formatTimeIST(snap.opening.submitted_at) : null}
              submitterName={
                snap.opening?.submitted_by
                  ? nameMap[snap.opening.submitted_by] ?? "Staff"
                  : null
              }
            />
            <ChecklistStatus
              icon={Sunset}
              label="Closing"
              done={Boolean(snap.closing)}
              time={snap.closing ? formatTimeIST(snap.closing.submitted_at) : null}
              submitterName={
                snap.closing?.submitted_by
                  ? nameMap[snap.closing.submitted_by] ?? "Staff"
                  : null
              }
            />
          </div>
        </Card>

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
      </div>

      {/* 7-day trend */}
      <Card className="p-4">
        <h2 className="mb-1 text-sm font-bold uppercase tracking-wider text-content-secondary">
          Last 7 days
        </h2>
        <SalesTrendChart data={trend} />
      </Card>

      {/* Activity + attendance */}
      <div className="grid gap-3 lg:grid-cols-2">
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

        <Card className="p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-content-secondary">
            <Users className="size-4" /> Attendance
          </h2>
          <Attendance opening={snap.opening} />
        </Card>
      </div>

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
  icon: Icon,
  label,
  done,
  time,
  submitterName,
}: {
  icon: typeof Sunrise;
  label: string;
  done: boolean;
  time: string | null;
  submitterName?: string | null;
}) {
  return (
    <div className="rounded-xl border border-border bg-bg-elevated p-3">
      <div className="flex items-center justify-between">
        <Icon className="size-4 text-content-secondary" />
        {done ? (
          <CheckCircle2 className="size-4 text-success" />
        ) : (
          <XCircle className="size-4 text-danger" />
        )}
      </div>
      <p className="mt-2 text-sm font-semibold">{label}</p>
      <p className="text-xs text-content-secondary font-mono">{done ? time : "Pending"}</p>
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

function Attendance({
  opening,
}: {
  opening: Awaited<ReturnType<typeof getTodaySnapshot>>["opening"];
}) {
  if (!opening) {
    return (
      <p className="py-4 text-sm text-content-secondary">
        Opening checklist not submitted yet.
      </p>
    );
  }
  const presentItem = opening.items.find((i) =>
    i.label.toLowerCase().includes("present"),
  );
  const allPresent = presentItem?.checked ?? false;
  const absent = opening.absent_staff?.trim();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {allPresent ? (
          <Badge variant="success">
            <CheckCircle2 className="size-3" /> All scheduled staff present
          </Badge>
        ) : (
          <Badge variant="warning">Some staff absent</Badge>
        )}
      </div>
      {absent ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-content-secondary">
            Absent
          </p>
          <p className="mt-0.5 text-sm">{absent}</p>
        </div>
      ) : (
        <p className="text-sm text-content-secondary">No absences recorded.</p>
      )}
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
