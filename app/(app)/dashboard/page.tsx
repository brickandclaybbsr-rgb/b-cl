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
} from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { getTodaySnapshot } from "@/lib/data/dashboard";
import { getClosingChecklist } from "@/lib/data/checklists";
import { getSalesRange } from "@/lib/data/sales";
import { daysAgoIST, formatDateLabel } from "@/lib/date";
import { APP_START_DATE } from "@/lib/constants";
import { formatINR } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

  const yesterday = daysAgoIST(1);
  const isFirstDay = snap.date === APP_START_DATE;

  // Fetch missing sales + yesterday's closing (for opening gate) in parallel
  const needsClosingGate = !snap.opening && myTeam && !isFirstDay;
  const [salesInWindow, yesterdayClosing] = await Promise.all([
    !kitchenOnly ? getSalesRange(APP_START_DATE, snap.date) : Promise.resolve([]),
    needsClosingGate ? getClosingChecklist(yesterday, myTeam) : Promise.resolve(null),
  ]);

  const closingGateActive = needsClosingGate && !yesterdayClosing;

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

      {/* Yesterday’s closing gate — blocks opening checklist */}
      {closingGateActive && (
        <Link href={`/checklist/closing?date=${yesterday}`} className="block mb-3">
          <Card className="flex items-start gap-3 border-warning/30 bg-warning/10 p-4">
            <AlertTriangle className="size-5 shrink-0 text-warning mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-warning">Yesterday&apos;s closing not filed</p>
              <p className="text-xs text-content-secondary mt-0.5">
                File it to unlock today&apos;s opening checklist
              </p>
            </div>
            <ChevronRight className="size-4 text-warning shrink-0 mt-0.5" />
          </Card>
        </Link>
      )}

      {/* Missing sales dates */}
      {missingSalesDates.length > 0 && (
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
    </div>
  );
}
