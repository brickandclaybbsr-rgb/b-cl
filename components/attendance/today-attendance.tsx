import { CheckCircle2, Clock, CalendarOff, AlertCircle, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TodayAttendance } from "@/lib/data/attendance";

const TEAM_LABEL: Record<string, string> = {
  kitchen: "Kitchen",
  front_desk: "Front Desk",
  head_chef: "Head Chef",
};

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

export function TodayAttendancePanel({ data }: { data: TodayAttendance }) {
  const dateLabel = new Date(data.date + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <Card className="p-5 space-y-4 bg-white/[0.02] border-border/40">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-content-primary">Today&apos;s Attendance</h3>
          <p className="text-xs text-content-secondary mt-0.5">{dateLabel} · QR check-in</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Stat label="Checked In" value={data.checkedInCount} tone="success" />
        <Stat label="Not Checked In" value={data.notCheckedInCount} tone={data.notCheckedInCount > 0 ? "danger" : "muted"} />
        <Stat label="On Leave" value={data.onLeaveCount} tone="muted" />
        <Stat label="Checked Out" value={data.checkedOutCount} tone="muted" />
      </div>

      {/* People */}
      {data.rows.length === 0 ? (
        <p className="text-xs text-content-secondary">No active staff to show.</p>
      ) : (
        <div className="divide-y divide-border/30 rounded-xl border border-border/30 overflow-hidden">
          {data.rows.map((r) => {
            const isIn = !!r.checkedInAt;
            const isLeave = !isIn && !!r.onLeave;
            return (
              <div key={r.profileId} className="flex items-center gap-3 px-3 py-2.5 text-xs">
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full",
                    isIn ? "bg-green-500/15 text-green-400"
                      : isLeave ? "bg-bg-elevated text-content-secondary"
                      : "bg-danger/15 text-danger",
                  )}
                >
                  {isIn ? <CheckCircle2 className="size-4" />
                    : isLeave ? <CalendarOff className="size-4" />
                    : <AlertCircle className="size-4" />}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-content-primary truncate">{r.name}</p>
                  <p className="text-[11px] text-content-secondary truncate">
                    {r.team ? TEAM_LABEL[r.team] ?? r.team : "No team"}
                    {isIn && r.outletName && (
                      <> · <MapPin className="inline size-3 -mt-0.5" /> {r.outletName}</>
                    )}
                    {isLeave && <> · {LEAVE_LABEL[r.onLeave!.type] ?? r.onLeave!.type}</>}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  {isIn ? (
                    <>
                      <p className="font-mono font-semibold text-content-primary">
                        In {time(r.checkedInAt!)}
                      </p>
                      <p className="text-[11px] text-content-secondary">
                        {r.checkedOutAt ? `Out ${time(r.checkedOutAt)}` : "Still on shift"}
                      </p>
                    </>
                  ) : isLeave ? (
                    <Badge variant="default" className="text-[9px] uppercase px-1.5 py-0 bg-bg-elevated text-content-secondary border border-border/30">
                      On leave
                    </Badge>
                  ) : (
                    <Badge variant="danger" className="text-[9px] uppercase px-1.5 py-0">
                      Not checked in
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="flex items-start gap-1.5 text-[11px] text-content-secondary">
        <Clock className="mt-0.5 size-3 shrink-0" />
        Updates as staff scan the outlet QR. House helpers are excluded — they don&apos;t use QR attendance.
      </p>
    </Card>
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
