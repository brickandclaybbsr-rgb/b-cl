"use client";

import { useState, useTransition, useMemo, useCallback, useEffect } from "react";
import { toast } from "sonner";
import {
  Upload,
  Calendar as CalendarIcon,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Clock,
  Trash2,
  ChevronDown,
  ChevronUp,
  Info,
  CalendarDays,
  User,
  ImageDown,
  X,
} from "lucide-react";
import { parseBiometricCSV, type BiometricRow } from "./csv-parser";
import { saveAttendancePunches, clearAttendanceForMonth } from "@/app/(app)/attendance/actions";
import { updateStaffBiometrics } from "@/app/(app)/settings/actions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { attendanceRate, buildMonthAttendance, CL_PER_MONTH, type LeaveRow } from "@/lib/leave-policy";
import { todayIST } from "@/lib/date";

interface StaffProfile {
  id: string;
  name: string;
  biometric_pin: string | null;
  biometric_name: string | null;
  role: string;
  date_of_joining?: string | null;
}

interface DBAttendancePunch {
  id: string;
  profile_id: string;
  pin: string;
  name: string;
  date: string;
  time: string;
  status: string | null;
  dept_name: string | null;
  uploaded_at: string;
}

interface DBAttendanceCheckin {
  id: string;
  profile_id: string;
  date: string;
  checked_in_at: string;
  checked_out_at: string | null;
}

/**
 * One attended day, whichever system recorded it. Biometric punches (CSV
 * uploads) cover everything up to the QR switch-over; QR check-ins cover
 * everything after, so the ledger has to read from both.
 */
interface DayLog {
  date: string;
  inTime: string;         // "HH:MM"
  outTime: string | null; // "HH:MM"
  source: "qr" | "biometric";
}

interface Props {
  staffList: StaffProfile[];
  currentProfile: StaffProfile;
  initialPunches: DBAttendancePunch[];
  initialCheckins?: DBAttendanceCheckin[];
  initialLeaves?: (LeaveRow & { profile_id: string })[];
}

/** Clock time of a timestamp in IST, 24h — same shape as a biometric punch time. */
function istClock(ts: string): string {
  return new Date(ts).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export function AttendanceClient({
  staffList,
  currentProfile,
  initialPunches,
  initialCheckins = [],
  initialLeaves = [],
}: Props) {
  const isOwner = currentProfile.role === "owner";

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [dbPunches, setDbPunches] = useState<DBAttendancePunch[]>(initialPunches);
  const [expandedStaffId, setExpandedStaffId] = useState<string | null>(null);

  // CSV upload state. Attendance is QR-first now, so the uploader lives behind
  // a button — it's only needed for months before the switch-over.
  const [uploadOpen, setUploadOpen] = useState(false);
  const [parsedRows, setParsedRows] = useState<BiometricRow[]>([]);
  const [unmatchedNames, setUnmatchedNames] = useState<string[]>([]);
  const [tempMappings, setTempMappings] = useState<Record<string, string>>({});
  const [saveMappingsDb, setSaveMappingsDb] = useState<Record<string, boolean>>({});
  const [isDragging, setIsDragging] = useState(false);

  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!uploadOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setUploadOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [uploadOpen]);

  const yearOptions = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];
  const monthString = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;

  const filteredPunches = useMemo(
    () => dbPunches.filter((p) => p.date.startsWith(monthString)),
    [dbPunches, monthString],
  );

  const filteredCheckins = useMemo(
    () => initialCheckins.filter((c) => c.date.startsWith(monthString)),
    [initialCheckins, monthString],
  );

  const staffStats = useMemo(() => {
    const maxDay = new Date(selectedYear, selectedMonth, 0).getDate();
    const today = todayIST();

    return staffList
      .filter((s) => s.role !== "owner")
      .map((staff) => {
        // Biometric: the earliest and latest punch of a day are its in/out.
        const bio: Record<string, { first: string; last: string }> = {};
        for (const p of filteredPunches) {
          if (p.profile_id !== staff.id) continue;
          const t = String(p.time ?? "").slice(0, 5);
          if (!t) continue;
          const cur = bio[p.date];
          if (!cur) bio[p.date] = { first: t, last: t };
          else {
            if (t < cur.first) cur.first = t;
            if (t > cur.last) cur.last = t;
          }
        }

        const byDate: Record<string, DayLog> = {};
        for (const [date, { first, last }] of Object.entries(bio)) {
          byDate[date] = {
            date,
            inTime: first,
            outTime: last !== first ? last : null,
            source: "biometric",
          };
        }

        // QR is the live source from the rollout onwards, so it wins on any day
        // that also happens to carry a stale biometric punch.
        for (const c of filteredCheckins) {
          if (c.profile_id !== staff.id) continue;
          byDate[c.date] = {
            date: c.date,
            inTime: istClock(c.checked_in_at),
            outTime: c.checked_out_at ? istClock(c.checked_out_at) : null,
            source: "qr",
          };
        }

        const days = Object.values(byDate).sort((a, b) => b.date.localeCompare(a.date));

        // Present / CL / absent all come from the shared policy module — the
        // same one payroll uses — so this screen and the payslip can never
        // disagree about a month. It also applies the auto-CL rule: unmarked
        // days become the weekly off, up to the monthly allowance.
        const summary = buildMonthAttendance({
          year: selectedYear,
          monthNum: selectedMonth,
          today,
          leaves: initialLeaves.filter(
            (l) => l.profile_id === staff.id && (l.status ?? "approved") === "approved",
          ),
          attendedDates: new Set(days.map((d) => d.date)),
          joiningDate: staff.date_of_joining ?? null,
        });

        return {
          staff,
          present: summary.presentCount,
          cl: summary.clCount,
          autoCl: summary.autoClCount,
          absent: summary.absentCount,
          lwp: summary.lwpCount,
          total: summary.countedDays,
          // Rated against rostered days — the weekly-off entitlement is free,
          // a fifth off / LWP / an absence is not. See attendanceRate.
          pct: attendanceRate(summary),
          fullMonthDays: maxDay,
          days,
          // Only biometric rows can be cleared — QR check-ins aren't uploads.
          biometricDays: Object.keys(bio).length,
        };
      });
  }, [staffList, filteredPunches, filteredCheckins, initialLeaves, selectedYear, selectedMonth]);

  // ── CSV handling ─────────────────────────────────────────────────────────

  const handleCSVUpload = (text: string) => {
    try {
      const rows = parseBiometricCSV(text);
      if (rows.length === 0) { toast.error("No valid attendance rows found in CSV."); return; }
      setParsedRows(rows);

      const uniqueCSVNames = Array.from(new Set(rows.map((r) => r.name))).filter(Boolean);
      const unmatched: string[] = [];
      const automaticMappings: Record<string, string> = {};

      uniqueCSVNames.forEach((csvName) => {
        // First try PIN match (most reliable), then biometric_name, then display name
        const sampleRow = rows.find((r) => r.name === csvName);
        const csvPin = sampleRow?.pin;

        const matchedProfile = staffList.find(
          (s) =>
            (csvPin && s.biometric_pin && s.biometric_pin === csvPin) ||
            s.biometric_name?.toLowerCase() === csvName.toLowerCase() ||
            s.name.toLowerCase() === csvName.toLowerCase(),
        );

        if (matchedProfile) {
          automaticMappings[csvName] = matchedProfile.id;
        } else {
          unmatched.push(csvName);
        }
      });

      setTempMappings(automaticMappings);
      setUnmatchedNames(unmatched);
      toast.success(`Parsed ${rows.length} rows. ${unmatched.length} name(s) need mapping.`);
    } catch (err: any) {
      toast.error("Failed to parse CSV: " + err.message);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => handleCSVUpload(ev.target?.result as string);
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => handleCSVUpload(ev.target?.result as string);
    reader.readAsText(file);
  };

  const handleSaveAttendance = () => {
    const unresolved = unmatchedNames.filter((n) => !tempMappings[n]);
    if (unresolved.length > 0) {
      toast.error(`Map these names first: ${unresolved.join(", ")}`);
      return;
    }
    startTransition(async () => {
      await Promise.all(
        Object.entries(tempMappings).map(async ([csvName, profileId]) => {
          if (unmatchedNames.includes(csvName) && saveMappingsDb[csvName]) {
            const sampleRow = parsedRows.find((r) => r.name === csvName);
            await updateStaffBiometrics(profileId, sampleRow?.pin || "", csvName);
          }
        }),
      );
      const punches = parsedRows
        .map((row) => {
          const profileId = tempMappings[row.name];
          if (!profileId) return null;
          return { profile_id: profileId, pin: row.pin, name: row.name, date: row.date, time: row.time, status: row.status || null, dept_name: row.deptName || null, uploaded_by: currentProfile.id };
        })
        .filter(Boolean) as any[];

      const res = await saveAttendancePunches(punches);
      if (res.error) { toast.error(res.error); }
      else { toast.success(res.message || "Attendance saved!"); window.location.reload(); }
    });
  };

  const handleClearMonth = (staffId: string, staffName: string) => {
    if (!confirm(`Clear ${staffName}'s attendance for ${monthString}?`)) return;
    startTransition(async () => {
      const res = await clearAttendanceForMonth(staffId, monthString);
      if (res.error) toast.error(res.error);
      else { toast.success(res.message); window.location.reload(); }
    });
  };

  // ── Punch log detail ──────────────────────────────────────────────────────

  const PunchLog = ({ days }: { days: DayLog[] }) => {
    if (days.length === 0) {
      return (
        <div className="py-8 text-center text-xs text-content-secondary">
          No attendance recorded for this month yet.
        </div>
      );
    }

    return (
      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5">
        {days.map((day) => {
          const d = new Date(day.date + "T00:00:00");
          const label = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

          return (
            <div key={day.date} className="flex items-center justify-between rounded-lg border border-border/30 bg-white/[0.015] px-3 py-2 gap-2">
              <span className="text-xs font-semibold text-content-primary min-w-[110px]">{label}</span>
              <div className="flex items-center gap-2 ml-auto">
                <span className="rounded border border-border bg-bg-elevated px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-content-secondary">
                  {day.source === "qr" ? "QR" : "Bio"}
                </span>
                <span className="rounded bg-success/10 border border-success/20 px-2 py-0.5 font-mono text-[11px] text-success">
                  In {day.inTime}
                </span>
                {day.outTime ? (
                  <span className="rounded bg-fire/10 border border-fire/20 px-2 py-0.5 font-mono text-[11px] text-fire">
                    Out {day.outTime}
                  </span>
                ) : (
                  <span className="text-[10px] text-content-secondary italic">No check-out</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ── Download attendance report as PNG ─────────────────────────────────────

  const downloadReport = useCallback(() => {
    const monthLabel = MONTHS.find((m) => m.value === selectedMonth)?.label ?? "";
    const title = `${monthLabel} ${selectedYear}`;

    const CANVAS_W = 690;
    const HEADER_H = 110;
    const COL_H = 38;
    const ROW_H = 40;
    const FOOTER_H = 36;
    const rows = staffStats.length;
    const CANVAS_H = HEADER_H + COL_H + rows * ROW_H + FOOTER_H;

    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background
    ctx.fillStyle = "#0c0c0c";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Top accent bar
    ctx.fillStyle = "#c2440f";
    ctx.fillRect(0, 0, CANVAS_W, 4);

    // Brand title
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px system-ui, sans-serif";
    ctx.fillText("Brick & Clay", 24, 38);

    // Subtitle
    ctx.fillStyle = "#aaaaaa";
    ctx.font = "13px system-ui, sans-serif";
    ctx.fillText(`Attendance Report — ${title}`, 24, 60);

    const generatedDate = new Date().toLocaleDateString("en-IN", {
      day: "numeric", month: "long", year: "numeric",
    });
    ctx.fillStyle = "#666666";
    ctx.font = "11px system-ui, sans-serif";
    ctx.fillText(`Generated: ${generatedDate}`, 24, 78);

    // Divider
    ctx.fillStyle = "#222222";
    ctx.fillRect(0, HEADER_H - 10, CANVAS_W, 1);

    // Column header bg
    ctx.fillStyle = "#161616";
    ctx.fillRect(0, HEADER_H, CANVAS_W, COL_H);

    // Column headers
    // LWP earns a column of its own: it pulls the rate down like an absence
    // does, so without it the % has no visible explanation on the report.
    const colX = [24, 250, 320, 385, 455, 525, 600];
    const colLabels = ["Staff Name", "Present", "CL", "LWP", "Absent", "Total", "%"];
    ctx.fillStyle = "#888888";
    ctx.font = "bold 11px system-ui, sans-serif";
    colLabels.forEach((label, i) => {
      ctx.fillText(label, colX[i], HEADER_H + 24);
    });

    // Rows
    staffStats.forEach(({ staff, present, cl, lwp, absent, total, pct }, i) => {
      const y = HEADER_H + COL_H + i * ROW_H;

      ctx.fillStyle = i % 2 === 0 ? "#111111" : "#0e0e0e";
      ctx.fillRect(0, y, CANVAS_W, ROW_H);

      // Name
      ctx.fillStyle = "#f0f0f0";
      ctx.font = "13px system-ui, sans-serif";
      ctx.fillText(staff.name, colX[0], y + 25);

      // Present (green)
      ctx.fillStyle = "#4ade80";
      ctx.font = "bold 13px system-ui, sans-serif";
      ctx.fillText(String(present), colX[1], y + 25);

      // Weekly off / CL (warm)
      ctx.fillStyle = "#fbbf24";
      ctx.fillText(String(cl), colX[2], y + 25);

      // LWP (warm, unpaid)
      ctx.fillStyle = "#fb923c";
      ctx.fillText(String(lwp), colX[3], y + 25);

      // Absent (red)
      ctx.fillStyle = "#f87171";
      ctx.fillText(String(absent), colX[4], y + 25);

      // Total (muted)
      ctx.fillStyle = "#888888";
      ctx.font = "13px system-ui, sans-serif";
      ctx.fillText(String(total), colX[5], y + 25);

      // Percentage (color-coded). Null = nothing to rate, e.g. a month before
      // the employee joined — a dash, not a damning 0%.
      const pctColor =
        pct == null ? "#666666" : pct >= 90 ? "#4ade80" : pct >= 75 ? "#fbbf24" : "#f87171";
      ctx.fillStyle = pctColor;
      ctx.font = "bold 13px system-ui, sans-serif";
      ctx.fillText(pct == null ? "—" : `${pct}%`, colX[6], y + 25);
    });

    // Footer
    const footerY = HEADER_H + COL_H + rows * ROW_H;
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, footerY, CANVAS_W, FOOTER_H);
    ctx.fillStyle = "#444444";
    ctx.font = "10px system-ui, sans-serif";
    ctx.fillText("Brick & Clay Operations · Internal Report", 24, footerY + 22);

    const filename = `attendance-${monthString}.png`;

    // Use toDataURL (synchronous) so we stay in the user-gesture stack.
    // canvas.toBlob() is async and breaks navigator.share() on Android WebView.
    const dataUrl = canvas.toDataURL("image/png");

    // Convert data URL → Blob synchronously
    const byteStr = atob(dataUrl.split(",")[1]);
    const buf = new Uint8Array(byteStr.length);
    for (let i = 0; i < byteStr.length; i++) buf[i] = byteStr.charCodeAt(i);
    const blob = new Blob([buf], { type: "image/png" });
    const file = new File([blob], filename, { type: "image/png" });

    // Try Web Share API with file (Android 10+ WebView / Safari iOS)
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [file] })
    ) {
      navigator
        .share({ files: [file], title: `Attendance Report — ${title}` })
        .catch(() => {/* user cancelled – no-op */});
      return;
    }

    // Fallback: open image in new tab so user can long-press save on Android
    // or the browser triggers a download on desktop
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // If anchor download silently fails (Android WebView), open in new tab
    setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 10000);
    window.open(objectUrl, "_blank");
  }, [staffStats, selectedMonth, selectedYear, monthString]);

  // ── Month / Year picker ───────────────────────────────────────────────────

  const MonthPicker = () => (
    <div className="flex items-center gap-2">
      <div className="relative">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          className="h-9 appearance-none rounded-xl border border-border bg-bg-elevated pl-3 pr-8 text-xs text-content-primary focus:border-border-strong focus:outline-none cursor-pointer min-w-[130px]"
        >
          {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-content-secondary" />
      </div>
      <div className="relative">
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="h-9 appearance-none rounded-xl border border-border bg-bg-elevated pl-3 pr-8 text-xs text-content-primary focus:border-border-strong focus:outline-none cursor-pointer"
        >
          {yearOptions.map((yr) => <option key={yr} value={yr}>{yr}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-content-secondary" />
      </div>
    </div>
  );

  // ── Owner CSV upload panel ─────────────────────────────────────────────────

  // Called as a plain function, not <OwnerUpload />, so the dropzone keeps its
  // state instead of remounting on every parent render.
  const OwnerUpload = () => (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-6 transition-colors cursor-pointer",
          isDragging ? "border-fire bg-fire/5" : "border-border bg-white/[0.01] hover:border-border-strong",
        )}
      >
        <input type="file" accept=".csv" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
        <div className="rounded-full border border-border bg-bg-elevated p-3 text-content-secondary">
          <FileSpreadsheet className="size-6 text-warm" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold">Drag & drop LX50 attendance CSV</p>
          <p className="mt-1 text-xs text-content-secondary">or click to browse</p>
        </div>
        <code className="rounded border border-border bg-bg-elevated px-2 py-1 text-[11px] font-mono text-content-secondary">
          Pin, Name, Date, Time, Status, Dept Name
        </code>
      </div>

      {parsedRows.length > 0 && (
        <div className="space-y-4 rounded-xl border border-border bg-white/[0.02] p-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <p className="text-sm font-bold">{parsedRows.length} punch logs parsed</p>
              <p className="text-xs text-content-secondary">Match unrecognised names below</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => { setParsedRows([]); setUnmatchedNames([]); }}>Cancel</Button>
          </div>

          {unmatchedNames.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-lg border border-warning/20 bg-warning/5 p-2.5 text-xs text-warning">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span><strong>{unmatchedNames.length} name(s)</strong> not auto-matched. Select their profile below.</span>
              </div>
              <div className="divide-y divide-border/50 max-h-52 overflow-y-auto">
                {unmatchedNames.map((name) => (
                  <div key={name} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <span className="font-mono text-xs font-semibold">{name}</span>
                    <div className="flex items-center gap-3">
                      <select
                        value={tempMappings[name] || ""}
                        onChange={(e) => setTempMappings((prev) => ({ ...prev, [name]: e.target.value }))}
                        className="h-8 rounded-lg border border-border bg-bg-elevated px-2.5 text-xs text-content-primary focus:outline-none"
                      >
                        <option value="">— Select staff —</option>
                        {staffList.filter((s) => s.role !== "owner").map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      {tempMappings[name] && (
                        <label className="flex cursor-pointer items-center gap-1.5 select-none">
                          <input
                            type="checkbox"
                            checked={saveMappingsDb[name] || false}
                            onChange={(e) => setSaveMappingsDb((prev) => ({ ...prev, [name]: e.target.checked }))}
                            className="size-3.5 rounded accent-fire"
                          />
                          <span className="text-[11px] text-content-secondary">Save to profile</span>
                        </label>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-success/20 bg-success/5 p-2.5 text-xs text-success">
              <CheckCircle2 className="size-4" />
              All names matched automatically via UID/PIN.
            </div>
          )}

          <Button className="w-full bg-white text-black hover:bg-white/90" disabled={pending} onClick={handleSaveAttendance}>
            {pending ? "Saving…" : "Save Attendance Logs"}
          </Button>
        </div>
      )}
    </div>
  );

  const UploadDialog = () => (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={() => setUploadOpen(false)}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-warm">
              <Upload className="size-4" /> Upload Biometric CSV
            </h2>
            <p className="mt-0.5 text-[11px] text-content-secondary">
              Only needed for months before the QR switch-over.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setUploadOpen(false)}
            className="shrink-0 rounded-lg p-1.5 text-content-secondary transition-colors hover:bg-white/5 hover:text-content-primary"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-4">{OwnerUpload()}</div>
      </div>
    </div>
  );

  // ── Owner staff cards view ────────────────────────────────────────────────

  const OwnerLedger = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-content-secondary flex items-center gap-1.5">
          <CalendarDays className="size-3.5 text-warm" />
          {MONTHS.find((m) => m.value === selectedMonth)?.label} {selectedYear}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-content-secondary">{staffStats.length} staff</span>
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-bg-elevated px-2.5 py-1.5 text-xs font-semibold text-content-primary hover:border-border-strong transition-colors"
            title="Upload biometric CSV — for months before the QR switch-over"
          >
            <Upload className="size-3.5 text-warm" />
            Upload CSV
          </button>
          <button
            type="button"
            onClick={downloadReport}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-bg-elevated px-2.5 py-1.5 text-xs font-semibold text-content-primary hover:border-border-strong transition-colors"
            title="Download attendance report as image"
          >
            <ImageDown className="size-3.5 text-warm" />
            Export
          </button>
        </div>
      </div>

      {staffStats.map(({ staff, present, cl, autoCl, lwp, absent, total, pct, days, biometricDays }) => {
        const isExpanded = expandedStaffId === staff.id;
        const hasUploads = biometricDays > 0;

        return (
          <Card key={staff.id} className="overflow-hidden">
            {/* Staff header row */}
            <div className="flex items-center gap-3 p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bg-elevated border border-border text-content-secondary">
                <User className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-content-primary">{staff.name}</span>
                  {staff.biometric_pin && (
                    <span className="rounded-md bg-bg-elevated border border-border px-1.5 py-0.5 font-mono text-[10px] text-content-secondary">
                      UID {staff.biometric_pin}
                    </span>
                  )}
                </div>
                {/* Compact stats inline */}
                <div className="mt-1.5 flex items-center gap-3 text-xs">
                  <span className="font-semibold text-success">{present}P</span>
                  {cl > 0 && (
                    <span
                      className="font-semibold text-warm"
                      title={autoCl > 0 ? `${autoCl} auto-applied as weekly off` : undefined}
                    >
                      {cl}CL{autoCl > 0 && <span className="text-content-secondary">*</span>}
                    </span>
                  )}
                  {lwp > 0 && <span className="font-semibold text-warning">{lwp}LWP</span>}
                  <span className="font-semibold text-danger">{absent}A</span>
                  <span className="text-content-secondary">{total} days</span>
                  <span
                    className={cn(
                      "font-bold ml-auto",
                      pct == null ? "text-content-secondary"
                        : pct >= 90 ? "text-success"
                        : pct >= 75 ? "text-warning"
                        : "text-danger",
                    )}
                  >
                    {pct == null ? "—" : `${pct}%`}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-1.5 rounded-full bg-bg-elevated overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      pct != null && pct >= 90 ? "bg-success"
                        : pct != null && pct >= 75 ? "bg-warning"
                        : "bg-danger",
                    )}
                    style={{ width: `${pct ?? 0}%` }}
                  />
                </div>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {hasUploads && (
                  <button
                    type="button"
                    onClick={() => handleClearMonth(staff.id, staff.name)}
                    className="rounded-lg p-1.5 text-content-secondary hover:bg-danger/10 hover:text-danger transition-colors"
                    title="Clear uploaded biometric logs"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setExpandedStaffId(isExpanded ? null : staff.id)}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-bg-elevated border border-border text-content-primary hover:border-border-strong transition-colors flex items-center gap-1"
                >
                  {isExpanded ? <><ChevronUp className="size-3.5" />Hide</> : <><ChevronDown className="size-3.5" />Logs</>}
                </button>
              </div>
            </div>

            {/* Expandable punch log */}
            {isExpanded && (
              <div className="border-t border-border/50 bg-bg-elevated/30 px-4 py-3">
                <p className="mb-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-content-secondary">
                  <Clock className="size-3" /> Attendance Log
                </p>
                <PunchLog days={days} />
              </div>
            )}
          </Card>
        );
      })}

      {staffStats.length === 0 && (
        <Card className="p-8 text-center text-xs text-content-secondary">No staff found.</Card>
      )}

      <div className="space-y-1 px-1 text-[10px] leading-relaxed text-content-secondary">
        {staffStats.some((s) => s.autoCl > 0) && (
          <p>
            <span className="text-warm">*</span> A day with no check-in and no applied
            leave counts as the weekly off / CL, up to {CL_PER_MONTH} a month. Beyond
            that it stays absent and unpaid.
          </p>
        )}
        <p>
          % is of the days rostered — {CL_PER_MONTH} weekly offs a month are free,
          so a fifth off, LWP or an absence pulls it down. Sick leave is neutral.
        </p>
      </div>
    </div>
  );

  // ── Staff self-view ───────────────────────────────────────────────────────

  const myStats = staffStats.find((s) => s.staff.id === currentProfile.id);
  const myPresent = myStats?.present ?? 0;
  const myAbsent = myStats?.absent ?? 0;
  const myTotal = myStats?.total ?? 0;
  const myFullMonth = myStats?.fullMonthDays ?? new Date(selectedYear, selectedMonth, 0).getDate();
  const myPct = myStats?.pct ?? null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header + month picker */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-4">
        <div>
          <h2 className="text-base font-bold text-content-primary flex items-center gap-2">
            <CalendarDays className="size-4 text-warm" />
            {isOwner ? "Staff Attendance" : "My Attendance"}
          </h2>
          <p className="mt-0.5 text-xs text-content-secondary">QR check-ins + uploaded biometric logs</p>
        </div>
        <MonthPicker />
      </div>

      {/* Staff refresh notice */}
      {!isOwner && (
        <Card className="flex items-start gap-3 border-warning/30 bg-warning/10 p-4 text-warning">
          <Info className="size-5 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold">Records updated monthly</p>
            <p className="mt-0.5 text-xs text-warning/80">
              Logs for each month are uploaded between the 12th–15th of the following month.
            </p>
          </div>
        </Card>
      )}

      {/* Owner: staff ledger cards, with the CSV uploader behind its button */}
      {isOwner && <OwnerLedger />}
      {isOwner && uploadOpen && UploadDialog()}

      {/* Staff: personal view */}
      {!isOwner && (
        <div className="space-y-4">
          {/* Summary chips */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-success/20 bg-success/5 p-4 text-center">
              <p className="text-3xl font-extrabold text-success">{myPresent}</p>
              <p className="mt-1 text-[11px] font-semibold text-content-secondary">Days Present</p>
            </div>
            <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-center">
              <p className="text-3xl font-extrabold text-danger">{myAbsent}</p>
              <p className="mt-1 text-[11px] font-semibold text-content-secondary">Days Absent</p>
            </div>
            <div className="rounded-xl border border-border bg-white/[0.02] p-4 text-center">
              <p className="text-3xl font-extrabold text-content-primary">{myTotal}</p>
              <p className="mt-1 text-[11px] font-semibold text-content-secondary">Days So Far</p>
              <p className="mt-0.5 text-[10px] text-content-secondary/60">this month to date</p>
            </div>
            <div className="rounded-xl border border-border bg-white/[0.02] p-4 text-center">
              <p className="text-3xl font-extrabold text-content-primary">{myFullMonth}</p>
              <p className="mt-1 text-[11px] font-semibold text-content-secondary">Full Month</p>
              <p className="mt-0.5 text-[10px] text-content-secondary/60">total calendar days</p>
            </div>
          </div>

          {/* Attendance % bar */}
          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-content-secondary">Monthly Attendance Rate</span>
              <span
                className={cn(
                  "font-bold",
                  myPct == null ? "text-content-secondary"
                    : myPct >= 90 ? "text-success"
                    : myPct >= 75 ? "text-warning"
                    : "text-danger",
                )}
              >
                {myPct == null ? "—" : `${myPct}%`}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-bg-elevated overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  myPct != null && myPct >= 90 ? "bg-success"
                    : myPct != null && myPct >= 75 ? "bg-warning"
                    : "bg-danger",
                )}
                style={{ width: `${myPct ?? 0}%` }}
              />
            </div>
            <p className="text-[10px] leading-relaxed text-content-secondary">
              Out of the days you were rostered — your {CL_PER_MONTH} weekly offs a
              month don&apos;t count against you.
            </p>
          </Card>

          {/* Daily log */}
          <Card className="p-4 space-y-3">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-content-secondary border-b border-border/40 pb-3">
              <CalendarIcon className="size-3.5 text-warm" /> Daily Log — {monthString}
            </p>
            <PunchLog days={myStats?.days ?? []} />
          </Card>
        </div>
      )}
    </div>
  );
}
