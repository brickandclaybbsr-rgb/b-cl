"use client";

import { useState, useTransition, useMemo } from "react";
import { toast } from "sonner";
import { 
  Upload, 
  Calendar as CalendarIcon, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  UserCheck, 
  ChevronDown, 
  ChevronUp, 
  Info,
  CalendarDays
} from "lucide-react";
import { parseBiometricCSV, type BiometricRow } from "./csv-parser";
import { saveAttendancePunches, clearAttendanceForMonth } from "@/app/(app)/attendance/actions";
import { updateStaffBiometrics } from "@/app/(app)/settings/actions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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

export function AttendanceClient({ staffList, currentProfile, initialPunches }: Props) {
  const isOwner = currentProfile.role === "owner";
  
  // Date selection states
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1); // 1-indexed

  // UI state
  const [dbPunches, setDbPunches] = useState<DBAttendancePunch[]>(initialPunches);
  const [expandedStaffId, setExpandedStaffId] = useState<string | null>(null);

  // CSV parsing states
  const [parsedRows, setParsedRows] = useState<BiometricRow[]>([]);
  const [unmatchedNames, setUnmatchedNames] = useState<string[]>([]);
  const [tempMappings, setTempMappings] = useState<Record<string, string>>({}); // CSV Name -> Profile ID
  const [saveMappingsDb, setSaveMappingsDb] = useState<Record<string, boolean>>({});
  const [isDragging, setIsDragging] = useState(false);

  const [pending, startTransition] = useTransition();

  const yearOptions = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];
  const monthOptions = [
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

  const monthString = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;

  // Filter punches for the selected month
  const filteredPunches = useMemo(() => {
    return dbPunches.filter((p) => p.date.startsWith(monthString));
  }, [dbPunches, monthString]);

  // Calculate stats per staff
  const staffStats = useMemo(() => {
    // Get year & month calendar days
    const totalDaysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    // If current month, only calculate up to today
    const maxDay = (selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1)
      ? Math.min(now.getDate(), totalDaysInMonth)
      : totalDaysInMonth;

    return staffList
      .filter((s) => s.role !== "owner")
      .map((staff) => {
        const punches = filteredPunches.filter((p) => p.profile_id === staff.id);
        const uniqueDaysPresent = new Set(punches.map((p) => p.date)).size;
        const daysAbsent = Math.max(0, maxDay - uniqueDaysPresent);

        return {
          staff,
          present: uniqueDaysPresent,
          absent: daysAbsent,
          total: maxDay,
          punches: punches.sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)),
        };
      });
  }, [staffList, filteredPunches, selectedYear, selectedMonth]);

  // Handle file drop/select
  const handleCSVUpload = (text: string) => {
    try {
      const rows = parseBiometricCSV(text);
      if (rows.length === 0) {
        toast.error("No valid attendance rows found in CSV.");
        return;
      }
      setParsedRows(rows);

      // Identify unmatched names
      const uniqueCSVNames = Array.from(new Set(rows.map((r) => r.name))).filter(Boolean);
      const unmatched: string[] = [];
      const automaticMappings: Record<string, string> = {};

      uniqueCSVNames.forEach((csvName) => {
        // Try matching by profile.biometric_name, profile.name, or profile.biometric_pin
        const matchedProfile = staffList.find(
          (s) =>
            s.biometric_name?.toLowerCase() === csvName.toLowerCase() ||
            s.name.toLowerCase() === csvName.toLowerCase()
        );

        if (matchedProfile) {
          automaticMappings[csvName] = matchedProfile.id;
        } else {
          unmatched.push(csvName);
        }
      });

      setTempMappings(automaticMappings);
      setUnmatchedNames(unmatched);
      toast.success(`Parsed ${rows.length} rows. Found ${unmatched.length} unmatched staff names.`);
    } catch (err: any) {
      toast.error("Failed to parse CSV: " + err.message);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleCSVUpload(text);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleCSVUpload(text);
    };
    reader.readAsText(file);
  };

  // Save the attendance records
  const handleSaveAttendance = () => {
    // Check if there are unmatched names that need mapping
    const unresolvedNames = unmatchedNames.filter((name) => !tempMappings[name]);
    if (unresolvedNames.length > 0) {
      toast.error(`Please map the remaining names first: ${unresolvedNames.join(", ")}`);
      return;
    }

    startTransition(async () => {
      // 1. Save mappings to DB if requested
      const mappingPromises = Object.entries(tempMappings).map(async ([csvName, profileId]) => {
        const isUnmatchedOriginally = unmatchedNames.includes(csvName);
        const shouldSaveToDb = saveMappingsDb[csvName];
        if (isUnmatchedOriginally && shouldSaveToDb) {
          const staff = staffList.find((s) => s.id === profileId);
          // Find biometric PIN for this name from the parsed rows
          const sampleRow = parsedRows.find((r) => r.name === csvName);
          const pin = sampleRow?.pin || staff?.biometric_pin || "";
          
          await updateStaffBiometrics(profileId, pin, csvName);
        }
      });
      await Promise.all(mappingPromises);

      // 2. Prepare punches payload
      const punchesToInsert = parsedRows
        .map((row) => {
          const profileId = tempMappings[row.name];
          if (!profileId) return null;
          return {
            profile_id: profileId,
            pin: row.pin,
            name: row.name,
            date: row.date,
            time: row.time,
            status: row.status || null,
            dept_name: row.deptName || null,
            uploaded_by: currentProfile.id,
          };
        })
        .filter(Boolean) as any[];

      // 3. Save to database
      const res = await saveAttendancePunches(punchesToInsert);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.message || "Attendance saved!");
        
        // Refresh local UI state (just trigger page reload or append to state)
        // For simple reactive feedback, let's refresh the browser page or pull updated punches
        window.location.reload();
      }
    });
  };

  // Clear attendance logs
  const handleClearMonth = (staffId: string, staffName: string) => {
    if (confirm(`Are you sure you want to clear attendance logs for ${staffName} in ${monthString}?`)) {
      startTransition(async () => {
        const res = await clearAttendanceForMonth(staffId, monthString);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success(res.message);
          window.location.reload();
        }
      });
    }
  };

  // Render Owner CSV upload view
  const renderOwnerUpload = () => {
    if (!isOwner) return null;

    return (
      <Card className="p-4 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-warm flex items-center gap-2">
          <Upload className="size-4" />
          Upload biometric attendance log
        </h2>

        {/* Drag and Drop Container */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer",
            isDragging ? "border-fire bg-fire/5" : "border-border hover:border-border-strong bg-white/[0.01]"
          )}
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <div className="bg-bg-elevated p-3 rounded-full text-content-secondary border border-border">
            <FileSpreadsheet className="size-6 text-warm" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold">Drag & drop your LX50 attendance CSV here</p>
            <p className="text-xs text-content-secondary mt-1">or click to browse from files</p>
          </div>
          <div className="text-[11px] text-content-secondary font-mono bg-bg-elevated px-2 py-1 rounded border border-border">
            Required columns: Pin, Name, Date, Time, Status, Dept Name
          </div>
        </div>

        {/* CSV Preview & Name Mapping */}
        {parsedRows.length > 0 && (
          <div className="space-y-4 rounded-xl border border-border bg-white/[0.02] p-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-content-primary">Parsed {parsedRows.length} Punch Logs</h3>
                <p className="text-xs text-content-secondary">Map unmatched biometric names to app profiles below.</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setParsedRows([])}>
                Cancel
              </Button>
            </div>

            {/* Unmatched staff name alerts & mapping dropdowns */}
            {unmatchedNames.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-warning bg-warning/5 border border-warning/10 p-2.5 rounded-lg text-xs">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Unmapped Biometric Names Detected!</span>
                    <p className="mt-0.5">Please map each name to their corresponding account to save their attendance.</p>
                  </div>
                </div>

                <div className="divide-y divide-border/60 max-h-[200px] overflow-y-auto pr-1">
                  {unmatchedNames.map((name) => (
                    <div key={name} className="py-2.5 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-mono font-semibold text-content-primary">{name}</span>
                      <div className="flex items-center gap-3">
                        <select
                          value={tempMappings[name] || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTempMappings((prev) => ({ ...prev, [name]: val }));
                          }}
                          className="h-8 rounded-lg border border-border bg-bg-elevated text-xs px-2.5 text-content-primary focus:border-border-strong focus:outline-none"
                        >
                          <option value="">-- Select Staff --</option>
                          {staffList
                            .filter((s) => s.role !== "owner")
                            .map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                        </select>

                        {tempMappings[name] && (
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={saveMappingsDb[name] || false}
                              onChange={(e) => {
                                const val = e.target.checked;
                                setSaveMappingsDb((prev) => ({ ...prev, [name]: val }));
                              }}
                              className="size-3.5 rounded border-border text-fire accent-fire"
                            />
                            <span className="text-[11px] text-content-secondary select-none">Save to DB</span>
                          </label>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-success bg-success/5 border border-success/10 p-2.5 rounded-lg text-xs">
                <CheckCircle2 className="size-4" />
                <span>All names in the CSV matched existing biometric staff configurations perfectly.</span>
              </div>
            )}

            <Button
              className="w-full text-black bg-white hover:bg-white/95"
              disabled={pending}
              onClick={handleSaveAttendance}
            >
              {pending ? "Saving Attendance Logs..." : "Save Attendance Logs"}
            </Button>
          </div>
        )}
      </Card>
    );
  };

  // Render a calendar-like timeline of daily punches for a selected staff member
  const renderDailyTimeline = (punches: DBAttendancePunch[]) => {
    if (punches.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-center space-y-3 h-full min-h-[220px]">
          <div className="bg-white/[0.02] p-4 rounded-full border border-border/40">
            <AlertCircle className="size-8 text-content-secondary/40 animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-bold text-content-primary">No Logs Recorded</p>
            <p className="text-xs text-content-secondary mt-1 max-w-[280px] mx-auto leading-relaxed">
              Biometric check-in logs for this staff member have not been uploaded for {monthString} yet.
            </p>
          </div>
        </div>
      );
    }

    // Group punches by date
    const dateGroups: Record<string, DBAttendancePunch[]> = {};
    punches.forEach((p) => {
      if (!dateGroups[p.date]) dateGroups[p.date] = [];
      dateGroups[p.date].push(p);
    });

    const sortedDates = Object.keys(dateGroups).sort((a, b) => b.localeCompare(a)); // Descending order (latest first)

    return (
      <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 flex-1">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-content-secondary flex items-center gap-1">
          <Clock className="size-3" /> Punch Log Details
        </h4>
        <div className="space-y-2.5">
          {sortedDates.map((dateStr) => {
            const datePunches = dateGroups[dateStr].sort((a, b) => a.time.localeCompare(b.time));
            const checkIn = datePunches[0];
            const checkOut = datePunches.length > 1 ? datePunches[datePunches.length - 1] : null;

            return (
              <div key={dateStr} className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg bg-white/[0.01] border border-border/30 gap-2 hover:bg-white/[0.02] transition-colors duration-150">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-content-primary">
                    {new Date(dateStr).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                  </span>
                  <Badge variant="default" className="text-[10px] bg-bg-elevated border-border text-content-primary px-1.5 py-0">
                    {datePunches.length} punch{datePunches.length > 1 ? "es" : ""}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div className="flex items-center gap-1 bg-success/5 border border-success/15 px-2 py-0.5 rounded text-success">
                    <span className="font-bold text-[10px] uppercase">In:</span>
                    <span className="font-mono">{checkIn.time.slice(0, 5)}</span>
                  </div>
                  {checkOut && (
                    <div className="flex items-center gap-1 bg-fire/5 border border-fire/15 px-2 py-0.5 rounded text-fire">
                      <span className="font-bold text-[10px] uppercase">Out:</span>
                      <span className="font-mono">{checkOut.time.slice(0, 5)}</span>
                    </div>
                  )}
                  {!checkOut && (
                    <span className="text-[10px] text-content-secondary italic">Single punch recorded</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Date filter & Selection */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-4">
        <div>
          <h2 className="text-base font-bold text-content-primary flex items-center gap-2">
            <CalendarDays className="size-4.5 text-warm" />
            {isOwner ? "Staff Attendance Ledger" : "Staff Attendance"}
          </h2>
          <p className="text-xs text-content-secondary mt-0.5">
            {isOwner ? "View and audit monthly biometric check-in times" : "View and audit monthly biometric check-in times"}
          </p>
        </div>

        {/* Month Picker dropdowns with custom chevron icons */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="h-9 appearance-none rounded-xl border border-border bg-bg-elevated text-xs pl-3 pr-8 text-content-primary focus:border-border-strong focus:outline-none cursor-pointer min-w-[125px]"
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-content-secondary pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="h-9 appearance-none rounded-xl border border-border bg-bg-elevated text-xs pl-3 pr-8 text-content-primary focus:border-border-strong focus:outline-none cursor-pointer"
            >
              {yearOptions.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-content-secondary pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Staff Notice (Only visible for Staff) */}
      {!isOwner && (
        <Card className="flex items-start gap-3 border-warning/30 bg-warning/10 p-4 text-warning">
          <Info className="size-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-sm">Attendance Refresh Period</span>
            <p className="text-xs text-warning/90 leading-relaxed">
              Attendance records are updated on a monthly basis. Fresh logs are compiled and uploaded by the management between the **12th and 15th of the following month**.
            </p>
          </div>
        </Card>
      )}

      {/* CSV upload component for Owner */}
      {renderOwnerUpload()}

      {/* Attendance Summary Dashboard */}
      {isOwner ? (
        // OWNER VIEW: All staff overview
        <Card className="p-4">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-content-secondary flex items-center gap-2">
            <CalendarDays className="size-4" />
            Monthly Attendance Ledger — {monthString}
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border text-xs uppercase text-content-secondary font-bold">
                  <th className="py-2.5">Staff Member</th>
                  <th className="py-2.5">Biometric PIN</th>
                  <th className="py-2.5 text-center">Days Present</th>
                  <th className="py-2.5 text-center">Days Absent</th>
                  <th className="py-2.5 text-center">Total Working Days</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {staffStats.map(({ staff, present, absent, total, punches }) => {
                  const isExpanded = expandedStaffId === staff.id;
                  return (
                    <tr key={staff.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="py-3 font-semibold text-content-primary">
                        <button
                          type="button"
                          onClick={() => setExpandedStaffId(isExpanded ? null : staff.id)}
                          className="flex items-center gap-1.5 text-left hover:text-warm transition-colors focus:outline-none"
                        >
                          {isExpanded ? <ChevronUp className="size-3.5 text-content-secondary" /> : <ChevronDown className="size-3.5 text-content-secondary" />}
                          {staff.name}
                        </button>
                      </td>
                      <td className="py-3 font-mono text-xs text-content-secondary">{staff.biometric_pin || "Not Mapped"}</td>
                      <td className="py-3 text-center text-success font-bold">{present} days</td>
                      <td className="py-3 text-center text-danger font-semibold">{absent} days</td>
                      <td className="py-3 text-center text-content-secondary">{total} days</td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setExpandedStaffId(isExpanded ? null : staff.id)}
                          >
                            Details
                          </Button>
                          {punches.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleClearMonth(staff.id, staff.name)}
                              className="p-1.5 rounded-lg text-content-secondary hover:bg-danger/10 hover:text-danger transition-colors"
                              title="Clear month's logs"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          )}
                        </div>
                        {isExpanded && (
                          <div className="text-left bg-bg-elevated/20 p-2.5 rounded-lg border border-border/40 mt-2">
                            {renderDailyTimeline(punches)}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        // STAFF VIEW: Personal monthly statistics and daily check-ins
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-stretch">
          {/* Summary Card */}
          <Card className="lg:col-span-1 p-5 flex flex-col justify-between bg-white/[0.01]">
            <div className="space-y-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-content-secondary">
                My Attendance Summary
              </h3>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-success/5 border border-success/15 rounded-xl p-3 flex flex-col justify-center items-center">
                  <span className="text-2xl font-extrabold text-success">
                    {staffStats.find((s) => s.staff.id === currentProfile.id)?.present || 0}
                  </span>
                  <span className="text-[10px] text-content-secondary font-semibold mt-1">Present</span>
                </div>
                <div className="bg-danger/5 border border-danger/15 rounded-xl p-3 flex flex-col justify-center items-center">
                  <span className="text-2xl font-extrabold text-danger">
                    {staffStats.find((s) => s.staff.id === currentProfile.id)?.absent || 0}
                  </span>
                  <span className="text-[10px] text-content-secondary font-semibold mt-1">Absent</span>
                </div>
                <div className="bg-white/[0.02] border border-border rounded-xl p-3 flex flex-col justify-center items-center">
                  <span className="text-2xl font-extrabold text-content-primary">
                    {staffStats.find((s) => s.staff.id === currentProfile.id)?.total || 0}
                  </span>
                  <span className="text-[10px] text-content-secondary font-semibold mt-1">Total Days</span>
                </div>
              </div>
            </div>

            {/* Progress Bar Rate */}
            <div className="pt-6 border-t border-border/30 mt-6">
              <div className="flex justify-between text-xs mb-2 font-semibold">
                <span className="text-content-secondary">Monthly Attendance Rate</span>
                <span className="text-success font-bold">
                  {Math.round(
                    (((staffStats.find((s) => s.staff.id === currentProfile.id)?.present || 0) /
                      (staffStats.find((s) => s.staff.id === currentProfile.id)?.total || 1)) *
                      100)
                  )}
                  %
                </span>
              </div>
              <div className="h-2 rounded-full bg-bg-elevated overflow-hidden border border-border/10">
                <div
                  className="h-full bg-success rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      ((staffStats.find((s) => s.staff.id === currentProfile.id)?.present || 0) /
                        (staffStats.find((s) => s.staff.id === currentProfile.id)?.total || 1)) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>
          </Card>

          {/* Details Card */}
          <Card className="lg:col-span-2 p-5 flex flex-col bg-white/[0.01]">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-content-secondary flex items-center gap-1.5 border-b border-border/40 pb-3">
              <CalendarIcon className="size-4 text-warm" /> Daily Log Details — {monthString}
            </h3>
            <div className="flex-1 flex flex-col justify-center">
              {renderDailyTimeline(staffStats.find((s) => s.staff.id === currentProfile.id)?.punches || [])}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
