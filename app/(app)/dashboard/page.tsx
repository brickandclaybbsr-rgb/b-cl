import Link from "next/link";
import {
  Sunrise,
  Sunset,
  IndianRupee,
  Package,
  ChevronRight,
  CheckCircle2,
  Circle,
  AlertTriangle,
  History,
  CalendarClock,
} from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { getTodaySnapshot } from "@/lib/data/dashboard";
import { getSalesRange, getSales, salesTotal } from "@/lib/data/sales";
import { getCashExpensesByDate } from "@/lib/data/expenses";
import { getProfileNameMap } from "@/lib/data/profiles";
import { formatDateLabel, formatTimeIST, daysAgoIST } from "@/lib/date";
import { APP_START_DATE } from "@/lib/constants";
import { formatINR } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { getMyAttendance } from "@/lib/data/attendance";
import { MyAttendanceToday } from "@/components/attendance/my-attendance";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CashExpense, StaffLeave } from "@/lib/database.types";

export const metadata = { title: "Home" };

function greeting() {
  const h = new Date().getUTCHours() + 5.5; // rough IST hour
  const hour = ((h % 24) + 24) % 24;
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function StaffDashboard() {
  const profile = await requireProfile();
  // Resolve team for snapshot — head_chef shares the kitchen record
  const myTeam: "kitchen" | "front_desk" | undefined =
    profile.team === "head_chef" ? "kitchen"
    : (profile.team as "kitchen" | "front_desk" | null | undefined) ?? undefined;
  const snap = await getTodaySnapshot(myTeam);
  const firstName = profile.name.split(" ")[0];
  const alerts = snap.lowItems.length + snap.outItems.length;
  const kitchenOnly = profile.team === "kitchen";

  // Staff see their own attendance. Owners don't use QR check-in, and house
  // helpers are paid daily in cash without attendance records at all.
  const myAttendance = profile.role === "staff" && !profile.is_house_helper
    ? await getMyAttendance(profile.id, 60).catch(() => null)
    : null;

  // Fetch sales range (front desk / owner only — skip for kitchen)
  const salesInWindow = !kitchenOnly
    ? await getSalesRange(APP_START_DATE, snap.date)
    : [];

  // Dates from launch with no sales entry (front desk only)
  const filedSalesDates = new Set(salesInWindow.map((s) => s.date));
  const missingSalesDates: string[] = [];
  for (let d = new Date(APP_START_DATE + "T00:00:00Z"); ; d.setUTCDate(d.getUTCDate() + 1)) {
    const str = d.toISOString().slice(0, 10);
    if (str >= snap.date) break;
    if (!filedSalesDates.has(str)) missingSalesDates.push(str);
  }

  const tasks = [
    {
      href: "/checklist/opening",
      icon: Sunrise,
      title: "Opening checklist",
      done: Boolean(snap.opening),
    },
    {
      href: "/checklist/closing",
      icon: Sunset,
      title: "Closing checklist",
      done: Boolean(snap.closing),
    },
    ...(!kitchenOnly
      ? [
          {
            href: "/sales",
            icon: IndianRupee,
            title: "Daily sales",
            done: Boolean(snap.sales),
            hint: snap.sales ? formatINR(snap.salesTotal) : undefined,
          },
        ]
      : []),
  ];

  // Leaves for this staff member
  let myLeaves: StaffLeave[] = [];
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("leaves")
      .select("*")
      .eq("profile_id", profile.id)
      .order("start_date", { ascending: false })
      .limit(10);
    myLeaves = (data ?? []) as StaffLeave[];
  } catch { /* table may not exist yet */ }

  const now = new Date();
  const currentYear = now.getFullYear().toString();
  const currentMonth = `${currentYear}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const getDays = (l: StaffLeave) => {
    const start = new Date(l.start_date + "T00:00:00");
    const end = new Date(l.end_date + "T00:00:00");
    return Math.ceil(Math.abs(end.getTime() - start.getTime()) / 86400000) + 1;
  };

  let clYear = 0, slYear = 0, lwpYear = 0, clMonth = 0, slMonth = 0;
  for (const l of myLeaves) {
    if (l.status !== "approved") continue;
    if (!l.start_date.startsWith(currentYear)) continue;
    const days = getDays(l);
    if (l.leave_type === "cl") { clYear += days; if (l.start_date.startsWith(currentMonth)) clMonth += days; }
    if (l.leave_type === "sl") { slYear += days; if (l.start_date.startsWith(currentMonth)) slMonth += days; }
    if (l.leave_type === "lwp") lwpYear += days;
  }

  const pendingLeaves = myLeaves.filter(l => l.status === "pending");
  const upcomingApproved = myLeaves.filter(
    l => l.status === "approved" && l.start_date >= snap.date
  );

  // Yesterday's data — strictly front_desk and head_chef only
  const canSeeYesterday = profile.team === "front_desk" || profile.team === "head_chef";
  const yesterday = daysAgoIST(1);
  const [yesterdaySales, yesterdayCashOut, nameMap] = canSeeYesterday
    ? await Promise.all([
        getSales(yesterday),
        getCashExpensesByDate(yesterday),
        getProfileNameMap(),
      ])
    : [null, [], {}];

  const additionalTasks = [
    {
      href: "/stock",
      icon: Package,
      title: "Stock update",
      subtitle: "Updated 3–4 times a month",
      done: Boolean(snap.stockSnapshot && snap.stockSnapshot.date === snap.date),
      hint: alerts > 0 ? `${alerts} to reorder` : undefined,
    },
  ];

  const completed = tasks.filter((t) => t.done).length;

  return (
    <div>
      <div className="mb-5">
        <p className="text-sm text-content-secondary">{formatDateLabel(snap.date)}</p>
        <h1 className="font-display text-2xl font-bold">
          {greeting()}, {firstName} 👋
        </h1>
      </div>

      {/* My attendance today */}
      {myAttendance && (
        <div className="mb-5">
          <MyAttendanceToday data={myAttendance} />
        </div>
      )}

      {/* progress */}
      <Card className="mb-5 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-content-secondary">
            Today&apos;s tasks
          </span>
          <span className="font-mono text-sm font-bold tabular-nums text-warm">
            {completed}/{tasks.length}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg-elevated">
          <div
            className="h-full fire-gradient transition-all"
            style={{ width: `${(completed / tasks.length) * 100}%` }}
          />
        </div>
      </Card>

      {/* Missing sales dates — front desk / owner only */}
      {missingSalesDates.length > 0 && !kitchenOnly && (
        <div className="mb-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">Sales not filed for {missingSalesDates.length} day{missingSalesDates.length > 1 ? "s" : ""} — file before today&apos;s sales</p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {missingSalesDates.map((d) => (
                  <Link
                    key={d}
                    href={`/sales?date=${d}`}
                    className="rounded-lg border border-warning/40 bg-warning/15 px-2.5 py-1 text-xs font-semibold"
                  >
                    {formatDateLabel(d)}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {tasks.map((task) => {
          const Icon = task.icon;
          return (
            <Link key={task.href} href={task.href} className="block">
              <Card className="flex items-center gap-3 p-4 transition-colors hover:border-border-strong">
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                    task.done ? "bg-success/15 text-success" : "bg-fire/15 text-fire"
                  }`}
                >
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{task.title}</p>
                  {task.hint && (
                    <p className="text-xs text-content-secondary">{task.hint}</p>
                  )}
                </div>
                {task.done ? (
                  <CheckCircle2 className="size-5 text-success" />
                ) : (
                  <Circle className="size-5 text-content-secondary/50" />
                )}
                <ChevronRight className="size-4 text-content-secondary" />
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Additional tasks */}
      <p className="mb-2 mt-6 text-xs font-bold uppercase tracking-wider text-content-secondary">
        Additional
      </p>
      <div className="space-y-3">
        {additionalTasks.map((task) => {
          const Icon = task.icon;
          return (
            <Link key={task.href} href={task.href} className="block">
              <Card className="flex items-center gap-3 p-4 transition-colors hover:border-border-strong">
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                    task.done ? "bg-success/15 text-success" : "bg-bg-elevated text-content-secondary"
                  }`}
                >
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{task.title}</p>
                  <p className="text-xs text-content-secondary">
                    {task.hint ?? task.subtitle}
                  </p>
                </div>
                {task.done ? (
                  <CheckCircle2 className="size-5 text-success" />
                ) : (
                  <Circle className="size-5 text-content-secondary/50" />
                )}
                <ChevronRight className="size-4 text-content-secondary" />
              </Card>
            </Link>
          );
        })}
      </div>

      {alerts > 0 && (
        <Link href="/stock" className="mt-5 block">
          <Card className="flex items-center gap-3 border-warning/30 bg-warning/10 p-4">
            <AlertTriangle className="size-5 shrink-0 text-warning" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-warning">
                {alerts} item{alerts > 1 ? "s" : ""} need reordering
              </p>
              <p className="text-xs text-content-secondary">
                {snap.outItems.length} out · {snap.lowItems.length} low
              </p>
            </div>
            <Badge variant="warning">Review</Badge>
          </Card>
        </Link>
      )}

      {/* Leaves section */}
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarClock className="size-4 text-content-secondary" />
            <p className="text-xs font-bold uppercase tracking-wider text-content-secondary">
              My Leaves
            </p>
          </div>
          <Link href="/profile" className="text-xs font-semibold text-warm hover:underline">
            View all
          </Link>
        </div>

        {/* Balance card — per-month & per-year */}
        <Card className="mb-3 overflow-hidden p-0">
          <div className="grid grid-cols-3 border-b border-border text-center">
            <div className="border-r border-border px-2 py-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-content-secondary">WL / CL</p>
            </div>
            <div className="border-r border-border px-2 py-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-content-secondary">Sick Leave</p>
            </div>
            <div className="px-2 py-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-content-secondary">LWP</p>
            </div>
          </div>
          <div className="grid grid-cols-3 divide-x divide-border">
            <div className="py-3 text-center">
              <p className="font-mono text-lg font-bold tabular-nums text-content-primary">{clMonth}</p>
              <p className="text-[10px] text-content-secondary">this month</p>
              <p className="mt-0.5 font-mono text-xs text-content-secondary">{clYear} / yr</p>
            </div>
            <div className="py-3 text-center">
              <p className="font-mono text-lg font-bold tabular-nums text-content-primary">{slMonth}</p>
              <p className="text-[10px] text-content-secondary">this month</p>
              <p className="mt-0.5 font-mono text-xs text-content-secondary">{slYear} / yr</p>
            </div>
            <div className="py-3 text-center">
              <p className="font-mono text-lg font-bold tabular-nums text-content-primary">{lwpYear}</p>
              <p className="text-[10px] text-content-secondary">this year</p>
            </div>
          </div>
        </Card>

        {pendingLeaves.length > 0 && (
          <Card className="mb-3 divide-y divide-border">
            {pendingLeaves.map(l => (
              <div key={l.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">{formatDateLabel(l.start_date)}{l.start_date !== l.end_date && ` → ${formatDateLabel(l.end_date)}`}</p>
                  <p className="text-xs text-content-secondary">{LEAVE_LABELS[l.leave_type]} · {l.reason}</p>
                </div>
                <Badge variant="warning">Pending</Badge>
              </div>
            ))}
          </Card>
        )}

        {upcomingApproved.length > 0 && (
          <Card className="divide-y divide-border">
            {upcomingApproved.map(l => (
              <div key={l.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">{formatDateLabel(l.start_date)}{l.start_date !== l.end_date && ` → ${formatDateLabel(l.end_date)}`}</p>
                  <p className="text-xs text-content-secondary">{LEAVE_LABELS[l.leave_type]} · {l.reason}</p>
                </div>
                <Badge variant="success">Approved</Badge>
              </div>
            ))}
          </Card>
        )}

        {myLeaves.length === 0 && (
          <p className="text-center text-xs text-content-secondary py-2">No leave records yet</p>
        )}
      </div>

      {/* Yesterday's summary — front desk & head chef only */}
      {canSeeYesterday && (
        <div className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <History className="size-4 text-content-secondary" />
            <p className="text-xs font-bold uppercase tracking-wider text-content-secondary">
              Yesterday · {formatDateLabel(yesterday)}
            </p>
          </div>

          {/* Yesterday's sales */}
          <Link href={`/sales?date=${yesterday}`} className="block mb-3">
            <Card className="p-4 transition-colors hover:border-border-strong">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold">Daily Sales</p>
                {yesterdaySales ? (
                  <span className="font-mono text-sm font-bold tabular-nums text-warm">
                    {formatINR(salesTotal(yesterdaySales))}
                  </span>
                ) : (
                  <span className="text-xs text-content-secondary">Not filed</span>
                )}
              </div>
              {yesterdaySales ? (
                <>
                  <div className="flex gap-4 text-xs text-content-secondary">
                    <span>Cash {formatINR(yesterdaySales.cash_sales)}</span>
                    <span>Online {formatINR(Number(yesterdaySales.card_sales) + Number(yesterdaySales.upi_sales))}</span>
                    <span>Aggregators {formatINR(yesterdaySales.aggregator_sales)}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-content-secondary opacity-70">
                    Filed by {yesterdaySales.submitted_by ? nameMap[yesterdaySales.submitted_by] ?? "Staff" : "Staff"}
                    {" · "}{formatTimeIST(yesterdaySales.submitted_at)}
                  </p>
                </>
              ) : (
                <p className="text-xs text-content-secondary">No sales entry for this date</p>
              )}
            </Card>
          </Link>

          {/* Yesterday's cash out — total only */}
          {yesterdayCashOut.length > 0 && (
            <Link href={`/sales?tab=expenses&date=${yesterday}`} className="block">
              <Card className="flex items-center justify-between px-4 py-3 transition-colors hover:border-border-strong">
                <p className="text-sm font-semibold">Cash Out</p>
                <span className="font-mono text-sm font-bold tabular-nums text-danger">
                  -{formatINR(yesterdayCashOut.reduce((s, e) => s + Number(e.amount), 0))}
                </span>
              </Card>
            </Link>
          )}

          {!yesterdaySales && yesterdayCashOut.length === 0 && (
            <p className="text-center text-xs text-content-secondary py-3">
              No data recorded for yesterday
            </p>
          )}
        </div>
      )}
    </div>
  );
}

const LEAVE_LABELS: Record<string, string> = {
  cl: "Casual Leave",
  sl: "Sick Leave",
  lwp: "Leave Without Pay",
};

function YesterdayCashOutRow({ entry }: { entry: CashExpense }) {
  const CATEGORY_LABELS: Record<string, string> = {
    withdrawal: "Withdrawal",
    advance: "Advance",
    expense: "Expense",
    other: "Other",
  };
  const CATEGORY_COLORS: Record<string, string> = {
    withdrawal: "text-danger",
    advance: "text-warning",
    expense: "text-warm",
    other: "text-content-secondary",
  };
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-content-primary">{entry.person_name}</p>
        <p className="text-xs text-content-secondary">
          <span className={CATEGORY_COLORS[entry.category] ?? "text-content-secondary"}>
            {CATEGORY_LABELS[entry.category] ?? entry.category}
          </span>
          {entry.notes && <> · {entry.notes}</>}
        </p>
      </div>
      <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-danger">
        -{formatINR(Number(entry.amount))}
      </span>
    </div>
  );
}
