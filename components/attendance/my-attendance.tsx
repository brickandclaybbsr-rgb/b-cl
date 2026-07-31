"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2, CalendarOff, AlertCircle, MapPin, QrCode, LogOut,
  ChevronDown, ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MyAttendance, MyAttendanceDay } from "@/lib/data/attendance";

const LEAVE_LABEL: Record<string, string> = {
  cl: "Weekly Off / CL",
  sl: "Sick Leave",
  lwp: "Leave Without Pay",
};

function time(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata",
  });
}

/** "14:05:00" -> "2:05 pm" */
function clock(hhmmss: string) {
  const [h, m] = hhmmss.split(":");
  const hour = parseInt(h, 10);
  const suffix = hour >= 12 ? "pm" : "am";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${m} ${suffix}`;
}

function dayNum(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit" });
}
function weekday(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short" });
}
function monthKey(date: string) {
  return date.slice(0, 7);
}
function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return new Date(parseInt(y), parseInt(m) - 1, 1)
    .toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

const isPresent = (d: MyAttendanceDay) => !!d.checkedInAt || d.source === "biometric";

/* ── Dashboard: today only ─────────────────────────────────────────────── */

export function MyAttendanceToday({ data }: { data: MyAttendance }) {
  const t = data.today;
  const isIn = !!t?.checkedInAt;
  const isOut = !!t?.checkedOutAt;
  const onLeave = !isIn && !!t?.leaveType;

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-content-secondary">
          My attendance today
        </h2>
        <Link href="/profile" className="text-[11px] font-semibold text-warm hover:underline">
          View all →
        </Link>
      </div>

      {isIn ? (
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-green-400">
            <CheckCircle2 className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-content-primary">
              {isOut ? "Shift complete" : "Checked in"}
            </p>
            <p className="text-xs text-content-secondary">
              In {time(t!.checkedInAt!)}
              {isOut ? ` · Out ${time(t!.checkedOutAt!)}` : " · still on shift"}
              {t!.outletName && <> · <MapPin className="inline size-3 -mt-0.5" /> {t!.outletName}</>}
            </p>
          </div>
          {!isOut && (
            <Link
              href="/attendance/checkin"
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-semibold text-content-secondary transition-colors hover:text-content-primary"
            >
              <LogOut className="size-3.5" /> Check out
            </Link>
          )}
        </div>
      ) : onLeave ? (
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bg-elevated text-content-secondary">
            <CalendarOff className="size-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-content-primary">On leave today</p>
            <p className="text-xs text-content-secondary">{LEAVE_LABEL[t!.leaveType!] ?? t!.leaveType}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-danger/15 text-danger">
            <AlertCircle className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-content-primary">Not checked in</p>
            <p className="text-xs text-content-secondary">Scan the outlet QR to start your day.</p>
          </div>
          <Link
            href="/attendance/checkin"
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[11px] font-bold text-black transition-opacity hover:opacity-90"
          >
            <QrCode className="size-3.5" /> Scan
          </Link>
        </div>
      )}
    </Card>
  );
}

/* ── Profile: month-by-month history ───────────────────────────────────── */

export function MyAttendanceHistory({ data }: { data: MyAttendance }) {
  const visible = data.days.filter((d) => !d.notEmployed);

  // Group into months, newest first (data.days is already newest-first).
  const months: { key: string; days: MyAttendanceDay[] }[] = [];
  for (const d of visible) {
    const key = monthKey(d.date);
    let bucket = months.find((m) => m.key === key);
    if (!bucket) { bucket = { key, days: [] }; months.push(bucket); }
    bucket.days.push(d);
  }

  const [open, setOpen] = useState<string | null>(months[0]?.key ?? null);

  if (visible.length === 0) {
    return (
      <Card className="p-5 text-center text-xs text-content-secondary">
        No attendance records yet.
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Overall totals */}
      <div className="grid grid-cols-3 gap-2.5">
        <Stat label="Present" value={data.presentCount} tone="success" />
        <Stat label="Leave" value={data.leaveCount} tone="muted" />
        <Stat label="Absent" value={data.absentCount} tone={data.absentCount > 0 ? "danger" : "muted"} />
      </div>

      {months.map((m) => {
        const present = m.days.filter(isPresent).length;
        const leave = m.days.filter((d) => !isPresent(d) && d.leaveType).length;
        const absent = m.days.filter((d) => !isPresent(d) && !d.leaveType).length;
        const isOpen = open === m.key;

        return (
          <Card key={m.key} className="overflow-hidden">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : m.key)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-bg-elevated/40"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-content-primary">{monthLabel(m.key)}</p>
                <p className="mt-0.5 flex flex-wrap gap-x-3 text-[11px] text-content-secondary">
                  <span className="text-green-400">{present} present</span>
                  {leave > 0 && <span>{leave} leave</span>}
                  {absent > 0 && <span className="text-danger">{absent} absent</span>}
                </p>
              </div>
              {isOpen
                ? <ChevronDown className="size-4 shrink-0 text-content-secondary" />
                : <ChevronRight className="size-4 shrink-0 text-content-secondary" />}
            </button>

            {isOpen && (
              <div className="divide-y divide-border/30 border-t border-border/40">
                {m.days.map((d) => <Row key={d.date} day={d} />)}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function Row({ day }: { day: MyAttendanceDay }) {
  const isQr = !!day.checkedInAt;
  const isBio = day.source === "biometric";
  const present = isQr || isBio;
  const onLeave = !present && !!day.leaveType;

  return (
    <div className="flex items-center gap-3 px-4 py-2 text-xs">
      {/* Date */}
      <div className="w-9 shrink-0 text-center">
        <p className="font-mono text-sm font-bold leading-none text-content-primary">{dayNum(day.date)}</p>
        <p className="mt-0.5 text-[10px] uppercase text-content-secondary">{weekday(day.date)}</p>
      </div>

      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full",
          present ? "bg-green-500/15 text-green-400"
            : onLeave ? "bg-bg-elevated text-content-secondary"
            : "bg-danger/15 text-danger",
        )}
      >
        {present ? <CheckCircle2 className="size-3" />
          : onLeave ? <CalendarOff className="size-3" />
          : <AlertCircle className="size-3" />}
      </span>

      {/* Times / status */}
      <div className="min-w-0 flex-1">
        {present ? (
          <p className="font-mono font-semibold text-content-primary">
            {isQr
              ? `${time(day.checkedInAt!)}${day.checkedOutAt ? ` – ${time(day.checkedOutAt)}` : ""}`
              : `${clock(day.punchIn!)}${day.punchOut ? ` – ${clock(day.punchOut)}` : ""}`}
          </p>
        ) : onLeave ? (
          <p className="text-content-secondary">{LEAVE_LABEL[day.leaveType!] ?? day.leaveType}</p>
        ) : (
          <p className="text-danger">Absent</p>
        )}
      </div>

      {/* Source — only meaningful on present days */}
      {present && (
        <span className="shrink-0 text-[10px] uppercase tracking-wider text-content-secondary/70">
          {isQr ? "QR" : "Bio"}
        </span>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "success" | "danger" | "muted" }) {
  const color = tone === "success" ? "text-green-400" : tone === "danger" ? "text-danger" : "text-content-primary";
  return (
    <div className="rounded-lg border border-border/30 bg-white/[0.01] p-2.5 text-center">
      <p className={cn("font-mono text-lg font-bold", color)}>{value}</p>
      <p className="text-[9px] uppercase tracking-wider text-content-secondary mt-0.5">{label}</p>
    </div>
  );
}
