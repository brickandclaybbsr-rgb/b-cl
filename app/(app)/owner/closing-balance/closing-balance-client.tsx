"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, IndianRupee } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatINR } from "@/lib/utils";
import type { ClosingBalanceDay } from "@/lib/data/reports";

const CATEGORY_LABELS: Record<string, string> = {
  withdrawal: "Withdrawal",
  advance: "Advance",
  expense: "Expense",
  other: "Other",
  deposit: "Deposit",
};

function fmtDate(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

function fmtDateShort(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function ClosingBalanceClient({
  selectedDate,
  selectedDay,
  range,
  rangeDays,
  today,
}: {
  selectedDate: string;
  selectedDay: ClosingBalanceDay;
  range: ClosingBalanceDay[];
  rangeDays: number;
  today: string;
}) {
  const router = useRouter();

  const goToDate = (date: string) => router.push(`/owner/closing-balance?date=${date}&days=${rangeDays}`, { scroll: false });
  const goToRange = (days: number) => router.push(`/owner/closing-balance?date=${selectedDate}&days=${days}`, { scroll: false });

  const d = selectedDay;
  const hasDiscrepancy =
    (d.openingDiscrepancy != null && d.openingDiscrepancy !== 0) ||
    (d.closingDiscrepancyNotes && d.closingDiscrepancyNotes.trim() !== "");

  // Rough sanity check only — actual float may legitimately differ (petty
  // cash carried over, unbanked change, etc.), so this is informational.
  const expectedClosing =
    d.openingCash != null ? d.openingCash + d.salesCash - d.cashOutTotal : null;

  return (
    <div className="space-y-5">
      {/* ── Date picker ─────────────────────────────────────────────── */}
      <Card className="flex flex-wrap items-center gap-3 p-4">
        <div className="flex-1 min-w-[180px] space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-content-secondary">Date</label>
          <Input
            type="date"
            value={selectedDate}
            max={today}
            onChange={(e) => e.target.value && goToDate(e.target.value)}
            style={{ colorScheme: "dark" }}
            className="h-10"
          />
        </div>
        <div className="flex gap-1.5">
          {[7, 14, 30, 60, 90].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => goToRange(n)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                rangeDays === n
                  ? "bg-white text-black"
                  : "border border-border text-content-secondary hover:text-content-primary"
              }`}
            >
              {n}d
            </button>
          ))}
        </div>
      </Card>

      {/* ── Selected date detail ────────────────────────────────────── */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-content-primary">{fmtDate(selectedDate)}</h2>
          {hasDiscrepancy ? (
            <span className="flex items-center gap-1 rounded-full bg-warning/15 text-warning px-2.5 py-1 text-[10px] font-bold uppercase">
              <AlertTriangle className="size-3" /> Discrepancy noted
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-success/15 text-success px-2.5 py-1 text-[10px] font-bold uppercase">
              <CheckCircle2 className="size-3" /> No discrepancy
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Stat label="Opening Cash" value={d.openingCash} />
          <Stat label="Cash Sales" value={d.salesCash} />
          <Stat label="Cash-Out Total" value={d.cashOutTotal} negative />
          <Stat label="Closing Cash" value={d.closingCash} highlight />
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <Stat label="Cash Deposited" value={d.cashDeposited} />
          <Stat label="Expected Closing (rough)" value={expectedClosing} muted />
          <Stat
            label="Variance"
            value={expectedClosing != null && d.closingCash != null ? d.closingCash - expectedClosing : null}
            variance
          />
        </div>

        {(d.openingDiscrepancyReason || d.closingDiscrepancyNotes) && (
          <div className="space-y-1.5 rounded-lg border border-warning/30 bg-warning/[0.06] p-3 text-xs">
            {d.openingDiscrepancyReason && (
              <p><span className="font-bold text-content-primary">Opening discrepancy note:</span> {d.openingDiscrepancyReason}</p>
            )}
            {d.closingDiscrepancyNotes && (
              <p><span className="font-bold text-content-primary">Closing discrepancy note:</span> {d.closingDiscrepancyNotes}</p>
            )}
          </div>
        )}

        {d.openingCash == null && d.closingCash == null && (
          <p className="text-xs text-content-secondary">No opening/closing checklist filed for this date.</p>
        )}

        {/* Cash-outs for the day */}
        <div className="space-y-2 pt-2 border-t border-border/30">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-content-secondary flex items-center gap-1.5">
            <IndianRupee className="size-3" /> Cash-Out Entries ({d.cashOut.length})
          </h3>
          {d.cashOut.length === 0 ? (
            <p className="text-xs text-content-secondary">No cash-out entries for this date.</p>
          ) : (
            <div className="divide-y divide-border/40 rounded-lg border border-border/30">
              {d.cashOut.map((e) => (
                <div key={e.id} className="flex items-center gap-2 px-3 py-2 text-xs">
                  <span className="font-semibold text-content-primary truncate">{e.person_name}</span>
                  <span className="text-content-secondary">{CATEGORY_LABELS[e.category] ?? e.category}</span>
                  {e.notes && <span className="text-content-secondary truncate">· {e.notes}</span>}
                  <span className={`ml-auto font-mono font-bold ${e.category === "deposit" ? "text-green-400" : "text-danger"}`}>
                    {e.category === "deposit" ? "+" : "-"}{formatINR(Number(e.amount))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* ── Day-wise table ───────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        <div className="p-4 pb-2">
          <h2 className="text-sm font-bold text-content-primary">Day-wise ({rangeDays} days)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-y border-border/40 bg-bg-elevated/40 text-left text-[10px] uppercase tracking-wider text-content-secondary">
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2 text-right">Opening</th>
                <th className="px-3 py-2 text-right">Closing</th>
                <th className="px-3 py-2 text-right">Deposited</th>
                <th className="px-3 py-2 text-right">Cash-Out</th>
                <th className="px-3 py-2 text-center">Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {range.map((row) => {
                const rowHasIssue =
                  (row.openingDiscrepancy != null && row.openingDiscrepancy !== 0) ||
                  (row.closingDiscrepancyNotes && row.closingDiscrepancyNotes.trim() !== "");
                return (
                  <tr
                    key={row.date}
                    onClick={() => goToDate(row.date)}
                    className={`cursor-pointer transition-colors hover:bg-bg-elevated/50 ${
                      row.date === selectedDate ? "bg-white/[0.04]" : ""
                    }`}
                  >
                    <td className="px-3 py-2 font-semibold text-content-primary">{fmtDateShort(row.date)}</td>
                    <td className="px-3 py-2 text-right font-mono">{row.openingCash != null ? formatINR(row.openingCash) : "—"}</td>
                    <td className="px-3 py-2 text-right font-mono">{row.closingCash != null ? formatINR(row.closingCash) : "—"}</td>
                    <td className="px-3 py-2 text-right font-mono">{row.cashDeposited != null ? formatINR(row.cashDeposited) : "—"}</td>
                    <td className="px-3 py-2 text-right font-mono text-danger">{row.cashOutTotal > 0 ? formatINR(row.cashOutTotal) : "—"}</td>
                    <td className="px-3 py-2 text-center">
                      {rowHasIssue ? <AlertTriangle className="mx-auto size-3.5 text-warning" /> : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  negative,
  highlight,
  muted,
  variance,
}: {
  label: string;
  value: number | null;
  negative?: boolean;
  highlight?: boolean;
  muted?: boolean;
  variance?: boolean;
}) {
  const color = variance && value != null
    ? value === 0 ? "text-content-secondary" : value > 0 ? "text-success" : "text-danger"
    : negative ? "text-danger" : highlight ? "text-content-primary" : muted ? "text-content-secondary" : "text-content-primary";

  return (
    <div className={`rounded-lg border p-2.5 ${highlight ? "border-white/20 bg-white/[0.03]" : "border-border/30 bg-white/[0.01]"}`}>
      <p className="text-[9px] uppercase tracking-wider text-content-secondary">{label}</p>
      <p className={`mt-0.5 font-mono text-sm font-bold ${color}`}>
        {value != null ? `${negative ? "-" : variance && value > 0 ? "+" : ""}${formatINR(Math.abs(value))}` : "—"}
      </p>
    </div>
  );
}
