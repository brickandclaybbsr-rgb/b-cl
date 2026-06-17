import Link from "next/link";
import {
  IndianRupee,
  Package,
  ShoppingCart,
  Sunrise,
  Sunset,
  CheckCircle2,
  XCircle,
  Activity,
  Wallet,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { getTodaySnapshot } from "@/lib/data/dashboard";
import { getSalesTrend, getSalesRange } from "@/lib/data/sales";
import { getTodayActivity } from "@/lib/data/activity";
import { getTodayCashExpenses } from "@/lib/data/expenses";
import { formatDateLabel, formatTimeIST } from "@/lib/date";
import { APP_START_DATE } from "@/lib/constants";
import { getProfileNameMap } from "@/lib/data/profiles";
import { formatINR } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { SalesTrendChart } from "@/components/charts/sales-trend-chart";
import { SendReportButton } from "@/components/send-report-button";
import { LeaveApprovalCards } from "@/components/owner/leave-approval-cards";
import { createClient } from "@/lib/supabase/server";
import { updateLeaveStatus } from "@/app/(app)/attendance/actions-hr";
import { revalidatePath } from "next/cache";
import type { StaffLeave } from "@/lib/database.types";

export const metadata = { title: "Dashboard" };

async function approveLeave(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  await updateLeaveStatus(id, "approved");
  revalidatePath("/owner");
}

async function rejectLeave(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  await updateLeaveStatus(id, "rejected");
  revalidatePath("/owner");
}

export default async function OwnerDashboard() {
  await requireOwner();

  const supabase = createClient();
  const [snap, trend, activity, nameMap, cashExpenses, leavesResult] = await Promise.all([
    getTodaySnapshot(),
    getSalesTrend(7),
    getTodayActivity(),
    getProfileNameMap(),
    getTodayCashExpenses(),
    supabase.from("leaves").select("*").eq("status", "pending").order("submitted_at", { ascending: true }),
  ]);

  const pendingLeaves = (leavesResult.data ?? []) as StaffLeave[];

  const salesWindowRecords = await getSalesRange(APP_START_DATE, snap.date);
  const alerts = snap.lowItems.length + snap.outItems.length;

  const filedSalesDates = new Set(salesWindowRecords.map((s) => s.date));
  const missingSalesDates: string[] = [];
  for (let d = new Date(APP_START_DATE + "T00:00:00Z"); ; d.setUTCDate(d.getUTCDate() + 1)) {
    const str = d.toISOString().slice(0, 10);
    if (str >= snap.date) break;
    if (!filedSalesDates.has(str)) missingSalesDates.push(str);
  }

  const cash = Number(snap.sales?.cash_sales ?? 0);
  const online = Number(snap.sales?.online_sales ?? 0);
  const agg = Number(snap.sales?.aggregator_sales ?? 0);
  const salesSubmitter = snap.sales?.submitted_by ? nameMap[snap.sales.submitted_by] ?? "Staff" : null;
  const cashOutTotal = cashExpenses.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-3">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-1">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-xs text-content-secondary mt-0.5">{formatDateLabel(snap.date)}</p>
        </div>
        <SendReportButton size="sm" variant="secondary" />
      </div>

      {/* ── Missing sales alert ─────────────────────────────────────────────── */}
      {missingSalesDates.length > 0 && (
        <div className="rounded-xl border border-warning/30 bg-warning/10 px-3 py-2.5 text-warning">
          <div className="flex items-center gap-2 text-xs font-semibold mb-1.5">
            <AlertTriangle className="size-3.5 shrink-0" />
            {missingSalesDates.length} day{missingSalesDates.length > 1 ? "s" : ""} missing sales
          </div>
          <div className="flex flex-wrap gap-1.5 pl-5">
            {missingSalesDates.map((d) => (
              <Link
                key={d}
                href={`/sales?date=${d}`}
                className="rounded-md border border-warning/40 bg-warning/15 px-2 py-0.5 text-[10px] font-semibold hover:bg-warning/25"
              >
                {formatDateLabel(d)}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Today's Sales ───────────────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-content-secondary flex items-center gap-1.5">
                <IndianRupee className="size-3 text-fire" />
                Today&apos;s Sales
              </p>
              {salesSubmitter && (
                <p className="text-[10px] text-content-secondary mt-0.5">
                  {salesSubmitter} · {formatTimeIST(snap.sales!.submitted_at)}
                </p>
              )}
            </div>
            <Link href="/sales" className="text-[11px] font-semibold text-warm">
              View →
            </Link>
          </div>

          {snap.salesTotal > 0 ? (
            <>
              <p className="font-mono text-3xl font-bold tabular-nums text-warm mt-2 mb-3">
                {formatINR(snap.salesTotal)}
              </p>

              {/* 3 metric chips */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="rounded-xl bg-bg-elevated px-2.5 py-2">
                  <p className="text-[10px] text-content-secondary">Cash</p>
                  <p className="font-mono text-sm font-bold tabular-nums mt-0.5">{formatINR(cash)}</p>
                </div>
                <div className="rounded-xl bg-bg-elevated px-2.5 py-2">
                  <p className="text-[10px] text-content-secondary">Online</p>
                  <p className="font-mono text-sm font-bold tabular-nums mt-0.5">{formatINR(online)}</p>
                </div>
                <div className="rounded-xl bg-bg-elevated px-2.5 py-2">
                  <p className="text-[10px] text-content-secondary">Aggregators</p>
                  <p className="font-mono text-[11px] font-bold tabular-nums mt-0.5">{formatINR(agg)}</p>
                </div>
              </div>

              {/* Split bars */}
              <div className="space-y-1.5">
                <SplitBar label="Cash" value={cash} total={snap.salesTotal} color="var(--color-fire, #e85d2f)" />
                <SplitBar label="Online (Card + UPI)" value={online} total={snap.salesTotal} color="#9A9AA2" />
                <SplitBar label="Aggregators" value={agg} total={snap.salesTotal} color="#4D4D55" />
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-content-secondary">Not filed yet today.</p>
          )}
        </div>
      </Card>

      {/* ── Stock Alerts + Pending Orders ───────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/stock">
          <Card className={`p-3 transition-colors hover:border-border-strong ${alerts > 0 ? "border-warning/40" : ""}`}>
            <div className="flex items-center justify-between mb-1.5">
              <Package className={`size-4 ${alerts > 0 ? "text-warning" : "text-success"}`} />
              {alerts > 0 && <span className="size-1.5 rounded-full bg-warning" />}
            </div>
            <p className="font-mono text-2xl font-bold tabular-nums">{alerts}</p>
            <p className="text-xs font-semibold text-content-secondary mt-0.5">Stock Alerts</p>
            <p className="text-[10px] text-content-secondary">{snap.outItems.length} out · {snap.lowItems.length} low</p>
          </Card>
        </Link>

        <Link href="/vendors">
          <Card className={`p-3 transition-colors hover:border-border-strong ${snap.pendingOrders > 0 ? "border-warning/40" : ""}`}>
            <div className="flex items-center justify-between mb-1.5">
              <ShoppingCart className={`size-4 ${snap.pendingOrders > 0 ? "text-warning" : "text-success"}`} />
              {snap.pendingOrders > 0 && <span className="size-1.5 rounded-full bg-warning" />}
            </div>
            <p className="font-mono text-2xl font-bold tabular-nums">{snap.pendingOrders}</p>
            <p className="text-xs font-semibold text-content-secondary mt-0.5">Pending Orders</p>
            <p className="text-[10px] text-content-secondary">awaiting action</p>
          </Card>
        </Link>
      </div>

      {/* ── Checklists — compact table layout ──────────────────────────────── */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-content-secondary">Checklists</h2>
          <Link href="/checklist/opening" className="text-[11px] font-semibold text-warm">View →</Link>
        </div>
        {/* Column headers */}
        <div className="grid grid-cols-[5rem_1fr_1fr] border-b border-border/50 bg-bg-elevated/40 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-content-secondary/50">
          <span />
          <span className="text-center">Kitchen</span>
          <span className="text-center">Dining</span>
        </div>
        {/* Opening */}
        <div className="grid grid-cols-[5rem_1fr_1fr] items-center border-b border-border/40 px-4 py-3">
          <div className="flex items-center gap-1.5">
            <Sunrise className="size-3.5 text-warm" />
            <span className="text-xs font-semibold">Opening</span>
          </div>
          <ChecklistCell
            done={Boolean(snap.openingKitchen)}
            time={snap.openingKitchen ? formatTimeIST(snap.openingKitchen.submitted_at) : null}
            name={snap.openingKitchen?.submitted_by ? nameMap[snap.openingKitchen.submitted_by] ?? null : null}
          />
          <ChecklistCell
            done={Boolean(snap.openingFrontDesk)}
            time={snap.openingFrontDesk ? formatTimeIST(snap.openingFrontDesk.submitted_at) : null}
            name={snap.openingFrontDesk?.submitted_by ? nameMap[snap.openingFrontDesk.submitted_by] ?? null : null}
          />
        </div>
        {/* Closing */}
        <div className="grid grid-cols-[5rem_1fr_1fr] items-center px-4 py-3">
          <div className="flex items-center gap-1.5">
            <Sunset className="size-3.5 text-content-secondary" />
            <span className="text-xs font-semibold">Closing</span>
          </div>
          <ChecklistCell
            done={Boolean(snap.closingKitchen)}
            time={snap.closingKitchen ? formatTimeIST(snap.closingKitchen.submitted_at) : null}
            name={snap.closingKitchen?.submitted_by ? nameMap[snap.closingKitchen.submitted_by] ?? null : null}
            cash={snap.closingKitchen?.closing_cash}
          />
          <ChecklistCell
            done={Boolean(snap.closingFrontDesk)}
            time={snap.closingFrontDesk ? formatTimeIST(snap.closingFrontDesk.submitted_at) : null}
            name={snap.closingFrontDesk?.submitted_by ? nameMap[snap.closingFrontDesk.submitted_by] ?? null : null}
            cash={snap.closingFrontDesk?.closing_cash}
          />
        </div>
      </Card>

      {/* ── Leave Requests ──────────────────────────────────────────────────── */}
      {pendingLeaves.length > 0 && (
        <LeaveApprovalCards
          leaves={pendingLeaves}
          nameMap={nameMap}
          approveAction={approveLeave}
          rejectAction={rejectLeave}
        />
      )}

      {/* ── 7-day trend ─────────────────────────────────────────────────────── */}
      <Card className="p-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="size-3.5 text-content-secondary" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-content-secondary">7-day trend</h2>
          </div>
          <Link href="/reports" className="text-[11px] font-semibold text-warm">Reports →</Link>
        </div>
        <SalesTrendChart data={trend} />
      </Card>

      {/* ── Cash Out — compact summary row ──────────────────────────────────── */}
      <Card className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Wallet className="size-4 text-content-secondary shrink-0" />
          <span className="text-sm font-semibold flex-1">Cash Out Today</span>
          {cashExpenses.length > 0 ? (
            <span className="text-[11px] text-content-secondary">
              {cashExpenses.length} expense{cashExpenses.length !== 1 ? "s" : ""}
            </span>
          ) : (
            <span className="text-xs text-content-secondary">None today</span>
          )}
          {cashExpenses.length > 0 && (
            <span className="font-mono text-sm font-bold text-danger">
              -{formatINR(cashOutTotal)}
            </span>
          )}
          <Link href="/owner/cashout" className="text-[11px] font-semibold text-warm shrink-0">
            View →
          </Link>
        </div>
      </Card>

      {/* ── Activity ────────────────────────────────────────────────────────── */}
      <Card className="p-3">
        <h2 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-content-secondary">
          <Activity className="size-3.5" /> Today&apos;s Activity
        </h2>
        {activity.length === 0 ? (
          <p className="py-2 text-xs text-content-secondary">No activity yet today.</p>
        ) : (
          <ul className="space-y-2">
            {activity.map((e, i) => (
              <li key={i} className="flex gap-2.5 text-xs">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-fire" />
                <div className="flex-1 min-w-0">
                  <span className="font-semibold">{e.actor}</span>{" "}
                  <span className="text-content-secondary">{e.action}</span>
                </div>
                <span className="shrink-0 text-[10px] text-content-secondary">{formatTimeIST(e.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

/* ─────────────────────────── Sub-components ─────────────────────────── */

function ChecklistCell({
  done, time, name, cash,
}: {
  done: boolean;
  time: string | null;
  name: string | null;
  cash?: number | null;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-0.5">
      {done ? (
        <>
          <CheckCircle2 className="size-4 text-success" />
          <span className="text-[10px] font-mono text-content-secondary leading-tight">{time}</span>
          {name && (
            <span className="text-[10px] text-warm leading-tight truncate max-w-[5rem]">
              {name.split(" ")[0]}
            </span>
          )}
          {cash != null && (
            <span className="text-[10px] font-mono font-semibold text-content-primary">{formatINR(cash)}</span>
          )}
        </>
      ) : (
        <>
          <XCircle className="size-4 text-danger/50" />
          <span className="text-[10px] text-content-secondary/50 leading-tight">Pending</span>
        </>
      )}
    </div>
  );
}

function SplitBar({
  label, value, total, color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-content-secondary">{label}</span>
        <span className="font-mono tabular-nums">{formatINR(value)} · {pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-bg-elevated">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
