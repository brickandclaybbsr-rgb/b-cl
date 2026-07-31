import Link from "next/link";
import { CheckCircle2, CalendarOff, AlertCircle, MapPin, QrCode, LogOut } from "lucide-react";
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

function dayLabel(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short",
  });
}

/** Compact "today" card for the staff dashboard. */
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

/** Full date-wise history for the profile page. */
export function MyAttendanceHistory({ data }: { data: MyAttendance }) {
  const visible = data.days.filter((d) => !d.notEmployed);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2.5">
        <Stat label="Present" value={data.presentCount} tone="success" />
        <Stat label="Leave" value={data.leaveCount} tone="muted" />
        <Stat label="Absent" value={data.absentCount} tone={data.absentCount > 0 ? "danger" : "muted"} />
      </div>

      {visible.length === 0 ? (
        <Card className="p-5 text-center text-xs text-content-secondary">
          No attendance records yet.
        </Card>
      ) : (
        <Card className="divide-y divide-border/30 overflow-hidden">
          {visible.map((d) => <Row key={d.date} day={d} />)}
        </Card>
      )}
    </div>
  );
}

/** "14:05:00" -> "2:05 pm" */
function clock(hhmmss: string) {
  const [h, m] = hhmmss.split(":");
  const hour = parseInt(h, 10);
  const suffix = hour >= 12 ? "pm" : "am";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${m} ${suffix}`;
}

function Row({ day }: { day: MyAttendanceDay }) {
  const isQr = !!day.checkedInAt;
  const isBio = day.source === "biometric";
  const isPresent = isQr || isBio;
  const onLeave = !isPresent && !!day.leaveType;

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 text-xs">
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full",
          isPresent ? "bg-green-500/15 text-green-400"
            : onLeave ? "bg-bg-elevated text-content-secondary"
            : "bg-danger/15 text-danger",
        )}
      >
        {isPresent ? <CheckCircle2 className="size-3.5" />
          : onLeave ? <CalendarOff className="size-3.5" />
          : <AlertCircle className="size-3.5" />}
      </span>

      <div className="min-w-0 flex-1">
        <p className="font-semibold text-content-primary">{dayLabel(day.date)}</p>
        <p className="text-[11px] text-content-secondary truncate">
          {isQr ? day.outletName ?? "QR check-in" : isBio ? "Biometric" : ""}
        </p>
      </div>

      <div className="shrink-0 text-right">
        {isQr ? (
          <>
            <p className="font-mono font-semibold text-content-primary">
              {time(day.checkedInAt!)}{day.checkedOutAt ? ` – ${time(day.checkedOutAt)}` : ""}
            </p>
            {!day.checkedOutAt && <p className="text-[10px] text-content-secondary">no check-out</p>}
          </>
        ) : isBio ? (
          <p className="font-mono font-semibold text-content-primary">
            {clock(day.punchIn!)}{day.punchOut ? ` – ${clock(day.punchOut)}` : ""}
          </p>
        ) : onLeave ? (
          <Badge variant="default" className="text-[9px] uppercase px-1.5 py-0 bg-bg-elevated text-content-secondary border border-border/30">
            {day.leaveType!.toUpperCase()}
          </Badge>
        ) : (
          <Badge variant="danger" className="text-[9px] uppercase px-1.5 py-0">Absent</Badge>
        )}
      </div>
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
