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
import { formatDateLabel } from "@/lib/date";
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
  const snap = await getTodaySnapshot();
  const firstName = profile.name.split(" ")[0];
  const alerts = snap.lowItems.length + snap.outItems.length;

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
    {
      href: "/sales",
      icon: IndianRupee,
      title: "Daily sales",
      done: Boolean(snap.sales),
      hint: snap.sales ? formatINR(snap.salesTotal) : undefined,
    },
    {
      href: "/stock",
      icon: Package,
      title: "Stock update",
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

      <div className="space-y-3">
        {tasks.map((task) => {
          const Icon = task.icon;
          return (
            <Link key={task.href} href={task.href} className="block">
              <Card className="flex items-center gap-3 p-4 transition-colors hover:border-border-strong">
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                    task.done
                      ? "bg-success/15 text-success"
                      : "bg-fire/15 text-fire"
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
