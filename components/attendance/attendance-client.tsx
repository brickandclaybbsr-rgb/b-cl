"use client";

import { useState, useTransition, useMemo, useCallback } from "react";
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
} from "lucide-react";
import { parseBiometricCSV, type BiometricRow } from "./csv-parser";
import { saveAttendancePunches, clearAttendanceForMonth } from "@/app/(app)/attendance/actions";
import { updateStaffBiometrics } from "@/app/(app)/settings/actions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StaffProfile {
  id: string;
  name: string;
  biometric_pin: string | null;
  biometric_name: string | null;
  role: string;
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

interface Props {
  staffList: StaffProfile[];
  currentProfile: StaffProfile;
  initialPunches: DBAttendancePunch[];
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

export function AttendanceClient({ staffList, currentProfile, initialPunches }: Props) {
  const isOwner = currentProfile.role === "owner";

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [dbPunches, setDbPunches] = useState<DBAttendancePunch[]>(initialPunches);
  const [expandedStaffId, setExpandedStaffId] = useState<string | null>(null);

  // CSV upload state
  const [parsedRows, setParsedRows] = useState<BiometricRow[]>([]);
  const [unmatchedNames, setUnmatchedNames] = useState<string[]>([]);
  const [tempMappings, setTempMappings] = useState<Record<string, string>>({});
  const [saveMappingsDb, setSaveMappingsDb] = useState<Record<string, boolean>>({});
  const [isDragging, setIsDragging] = useState(false);

  const [pending, startTransition] = useTransition();

  const yearOptions = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];
  const monthString = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;

  const filteredPunches = useMemo(
    () => dbPunches.filter((p) => p.date.startsWith(monthString)),
    [dbPunches, monthString],
  );

  const staffStats = useMemo(() => {
    const maxDay = new Date(selectedYear, selectedMonth, 0).getDate();
    // For the current month only count days that have actually passed
    const isCurrentMonth =
      selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1;
    const elapsedDays = isCurrentMonth ? now.getDate() : maxDay;

    return staffList
      .filter((s) => s.role !== "owner")
      .map((staff) => {
        const punches = filteredPunches
          .filter((p) => p.profile_id === staff.id)
          .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
        const daysPresent = new Set(punches.map((p) => p.date)).size;
        return {
          staff,
          present: daysPresent,
          absent: Math.max(0, elapsedDays - daysPresent),
          total: elapsedDays,
          fullMonthDays: maxDay,
          punches,
        };
      });
  }, [staffList, filteredPunches, selectedYear, selectedMonth]);

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

  const PunchLog = ({ punches }: { punches: DBAttendancePunch[] }) => {
    if (punches.length === 0) {
      return (
        <div className="py-8 text-center text-xs text-content-secondary">
          No logs uploaded for this month yet.
        </div>
      );
    }

    const groups: Record<string, DBAttendancePunch[]> = {};
    punches.forEach((p) => {
      (groups[p.date] ??= []).push(p);
    });
    const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

    return (
      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5">
        {sortedDates.map((dateStr) => {
          const dayPunches = groups[dateStr].sort((a, b) => a.time.localeCompare(b.time));
          const checkIn = dayPunches[0];
          const checkOut = dayPunches.length > 1 ? dayPunches[dayPunches.length - 1] : null;
          const d = new Date(dateStr + "T00:00:00");
          const label = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

          return (
            <div key={dateStr} className="flex items-center justify-between rounded-lg border border-border/30 bg-white/[0.015] px-3 py-2 gap-2">
              <span className="text-xs font-semibold text-content-primary min-w-[110px]">{label}</span>
              <div className="flex items-center gap-2 ml-auto">
                <span className="rounded bg-success/10 border border-success/20 px-2 py-0.5 font-mono text-[11px] text-success">
                  In {checkIn.time.slice(0, 5)}
                </span>
                {checkOut ? (
                  <span className="rounded bg-fire/10 border border-fire/20 px-2 py-0.5 font-mono text-[11px] text-fire">
                    Out {checkOut.time.slice(0, 5)}
                  </span>
                ) : (
                  <span className="text-[10px] text-content-secondary italic">1 punch</span>
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

    const CANVAS_W = 620;
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
    const colX = [24, 260, 340, 420, 500, 560];
    const colLabels = ["Staff Name", "Present", "Absent", "Total", "%"];
    ctx.fillStyle = "#888888";
    ctx.font = "bold 11px system-ui, sans-serif";
    colLabels.forEach((label, i) => {
      ctx.fillText(label, colX[i], HEADER_H + 24);
    });

    // Rows
    staffStats.forEach(({ staff, present, absent, total }, i) => {
      const pct = total > 0 ? Math.round((present / total) * 100) : 0;
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

      // Absent (red)
      ctx.fillStyle = "#f87171";
      ctx.fillText(String(absent), colX[2], y + 25);

      // Total (muted)
      ctx.fillStyle = "#888888";
      ctx.font = "13px system-ui, sans-serif";
      ctx.fillText(String(total), colX[3], y + 25);

      // Percentage (color-coded)
      const pctColor = pct >= 90 ? "#4ade80" : pct >= 75 ? "#fbbf24" : "#f87171";
      ctx.fillStyle = pctColor;
      ctx.font = "bold 13px system-ui, sans-serif";
      ctx.fillText(`${pct}%`, colX[4], y + 25);
    });

    // Footer
    const footerY = HEADER_H + COL_H + rows * ROW_H;
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, footerY, CANVAS_W, FOOTER_H);
    ctx.fillStyle = "#444444";
    ctx.font = "10px system-ui, sans-serif";
    ctx.fillText("Brick & Clay Operations · Internal Report", 24, footerY + 22);

    const filename = `attendance-${monthString}.png`;

    const triggerDownload = (url: string) => {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };

    canvas.toBlob((blob) => {
      if (!blob) {
        triggerDownload(canvas.toDataURL("image/png"));
        return;
      }
      const file = new File([blob], filename, { type: "image/png" });
      if (typeof navigator !== "undefined" && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: `Attendance Report — ${title}` }).catch(() => {
          triggerDownload(URL.createObjectURL(blob));
        });
      } else {
        triggerDownload(URL.createObjectURL(blob));
      }
    }, "image/png");
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

  const OwnerUpload = () => (
    <Card className="p-4 space-y-4">
      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-warm">
        <Upload className="size-4" /> Upload Biometric CSV
      </h2>
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
    </Card>
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
            onClick={downloadReport}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-bg-elevated px-2.5 py-1.5 text-xs font-semibold text-content-primary hover:border-border-strong transition-colors"
            title="Download attendance report as image"
          >
            <ImageDown className="size-3.5 text-warm" />
            Export
          </button>
        </div>
      </div>

      {staffStats.map(({ staff, present, absent, total, punches }) => {
        const isExpanded = expandedStaffId === staff.id;
        const pct = total > 0 ? Math.round((present / total) * 100) : 0;
        const hasLogs = punches.length > 0;

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
                  <span className="font-semibold text-danger">{absent}A</span>
                  <span className="text-content-secondary">{total} days</span>
                  <span className={cn("font-bold ml-auto", pct >= 90 ? "text-success" : pct >= 75 ? "text-warning" : "text-danger")}>
                    {pct}%
                  </span>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-1.5 rounded-full bg-bg-elevated overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", pct >= 90 ? "bg-success" : pct >= 75 ? "bg-warning" : "bg-danger")}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {hasLogs && (
                  <button
                    type="button"
                    onClick={() => handleClearMonth(staff.id, staff.name)}
                    className="rounded-lg p-1.5 text-content-secondary hover:bg-danger/10 hover:text-danger transition-colors"
                    title="Clear logs"
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
                  <Clock className="size-3" /> Punch Log
                </p>
                <PunchLog punches={punches} />
              </div>
            )}
          </Card>
        );
      })}

      {staffStats.length === 0 && (
        <Card className="p-8 text-center text-xs text-content-secondary">No staff found.</Card>
      )}
    </div>
  );

  // ── Staff self-view ───────────────────────────────────────────────────────

  const myStats = staffStats.find((s) => s.staff.id === currentProfile.id);
  const myPresent = myStats?.present ?? 0;
  const myAbsent = myStats?.absent ?? 0;
  const myTotal = myStats?.total ?? 0;
  const myFullMonth = myStats?.fullMonthDays ?? new Date(selectedYear, selectedMonth, 0).getDate();
  const myPct = myTotal > 0 ? Math.round((myPresent / myTotal) * 100) : 0;

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
          <p className="mt-0.5 text-xs text-content-secondary">Monthly biometric check-in logs</p>
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

      {/* Owner: CSV upload */}
      {isOwner && <OwnerUpload />}

      {/* Owner: staff ledger cards */}
      {isOwner && <OwnerLedger />}

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
              <span className={cn("font-bold", myPct >= 90 ? "text-success" : myPct >= 75 ? "text-warning" : "text-danger")}>
                {myPct}%
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-bg-elevated overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500", myPct >= 90 ? "bg-success" : myPct >= 75 ? "bg-warning" : "bg-danger")}
                style={{ width: `${myPct}%` }}
              />
            </div>
          </Card>

          {/* Daily log */}
          <Card className="p-4 space-y-3">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-content-secondary border-b border-border/40 pb-3">
              <CalendarIcon className="size-3.5 text-warm" /> Daily Log — {monthString}
            </p>
            <PunchLog punches={myStats?.punches ?? []} />
          </Card>
        </div>
      )}
    </div>
  );
}
