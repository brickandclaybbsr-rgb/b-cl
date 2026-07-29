"use client";

import { useState } from "react";
import { IndianRupee, Wallet, ClipboardCheck, CalendarClock, FileDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SECTIONS: { key: string; label: string; description: string; icon: typeof IndianRupee }[] = [
  { key: "sales", label: "Daily Sales (Cash)", description: "Cash sales per day", icon: IndianRupee },
  { key: "cashout", label: "Cash-Out Entries", description: "Every withdrawal, advance, expense, deposit", icon: Wallet },
  { key: "closing", label: "Closing Balance", description: "Opening/closing cash, deposits, discrepancies", icon: ClipboardCheck },
  { key: "attendance", label: "Attendance / Checklist Status", description: "Opening & closing checklist filed y/n per day", icon: CalendarClock },
  { key: "leaves", label: "Leave Requests", description: "All leaves overlapping the selected range", icon: CalendarClock },
];

function todayIST() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}
function daysAgoIST(days: number) {
  const d = new Date(Date.now() - days * 86400000);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

export function ExportReportClient() {
  const today = todayIST();
  const [from, setFrom] = useState(daysAgoIST(29));
  const [to, setTo] = useState(today);
  const [selected, setSelected] = useState<Record<string, boolean>>({
    sales: true, cashout: true, closing: true, attendance: false, leaves: false,
  });

  const toggle = (key: string) => setSelected((s) => ({ ...s, [key]: !s[key] }));
  const anySelected = Object.values(selected).some(Boolean);

  const href = (() => {
    const sections = Object.entries(selected).filter(([, v]) => v).map(([k]) => k).join(",");
    const params = new URLSearchParams({ from, to, sections });
    return `/api/reports/export?${params.toString()}`;
  })();

  return (
    <div className="space-y-5">
      <Card className="p-4 space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-content-secondary">Date Range</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="from">From</Label>
            <Input id="from" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} style={{ colorScheme: "dark" }} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="to">To</Label>
            <Input id="to" type="date" value={to} min={from} max={today} onChange={(e) => setTo(e.target.value)} style={{ colorScheme: "dark" }} />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {[
            { label: "Today", from: today, to: today },
            { label: "7 days", from: daysAgoIST(6), to: today },
            { label: "30 days", from: daysAgoIST(29), to: today },
            { label: "This month", from: today.slice(0, 8) + "01", to: today },
          ].map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => { setFrom(p.from); setTo(p.to); }}
              className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-content-secondary transition-colors hover:text-content-primary"
            >
              {p.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-content-secondary">What to include</h2>
        <div className="space-y-2">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const active = !!selected[s.key];
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => toggle(s.key)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                  active ? "border-white/30 bg-white/[0.04]" : "border-border/30 bg-white/[0.01] hover:border-border-strong"
                }`}
              >
                <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${active ? "bg-white text-black" : "bg-bg-elevated text-content-secondary"}`}>
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-content-primary">{s.label}</p>
                  <p className="text-[11px] text-content-secondary">{s.description}</p>
                </div>
                <div className={`size-5 shrink-0 rounded-md border-2 flex items-center justify-center ${active ? "border-white bg-white" : "border-border"}`}>
                  {active && <div className="size-2.5 rounded-sm bg-black" />}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {anySelected ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-black transition-opacity hover:opacity-90"
        >
          <FileDown className="size-4" /> Open Report (then Print → Save as PDF)
        </a>
      ) : (
        <div className="rounded-xl border border-dashed border-border py-3 text-center text-xs text-content-secondary">
          Select at least one section to include.
        </div>
      )}
      <p className="text-center text-[11px] text-content-secondary">
        The report opens in a new tab and its print dialog opens automatically — choose "Save as PDF" as the destination.
      </p>
    </div>
  );
}
