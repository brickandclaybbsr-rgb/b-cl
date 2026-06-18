"use client";

import { useState } from "react";
import { ChevronDown, Pencil, TrendingUp, Receipt } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { formatDateLabel } from "@/lib/date";
import type { DailySales } from "@/lib/database.types";

interface Props {
  sales: DailySales[];
  today: string;
  yesterday: string;
  canEdit: boolean;
}

function getTotal(s: DailySales) {
  return (
    Number(s.cash_sales) + Number(s.upi_sales) + Number(s.card_sales) +
    Number(s.zomato_gold_sales) + Number(s.zomato_sales) + Number(s.swiggy_sales) +
    Number(s.swiggy_dineout_sales) + Number(s.eazy_diner_sales)
  );
}

function getDirectTotal(s: DailySales) {
  return Number(s.cash_sales) + Number(s.upi_sales) + Number(s.card_sales);
}

function getPlatformTotal(s: DailySales) {
  return (
    Number(s.zomato_gold_sales) + Number(s.zomato_sales) +
    Number(s.swiggy_sales) + Number(s.swiggy_dineout_sales) + Number(s.eazy_diner_sales)
  );
}

export function Last7DaysAccordion({ sales, today, yesterday, canEdit }: Props) {
  const [openDate, setOpenDate] = useState<string | null>(sales[0]?.date ?? null);

  if (sales.length === 0) return null;

  const weekTotal = sales.reduce((sum, s) => sum + getTotal(s), 0);
  const maxTotal = Math.max(...sales.map(getTotal));
  const avgDaily = weekTotal / sales.length;

  return (
    <div className="space-y-3">
      {/* ── Week summary strip ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-0.5 rounded-xl border border-border bg-bg-elevated px-4 py-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-content-secondary">
            7-day total
          </span>
          <span className="font-mono text-lg font-bold tabular-nums text-warm">
            {formatINR(weekTotal)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5 rounded-xl border border-border bg-bg-elevated px-4 py-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-content-secondary">
            Daily average
          </span>
          <span className="font-mono text-lg font-bold tabular-nums text-content-primary">
            {formatINR(Math.round(avgDaily))}
          </span>
        </div>
      </div>

      {/* ── Accordion list ────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-border divide-y divide-border">
        {sales.map((s) => {
          const total = getTotal(s);
          const isOpen = openDate === s.date;
          const isToday = s.date === today;
          const isYesterday = s.date === yesterday;
          const isEditable = canEdit && (isToday || isYesterday);
          const pct = maxTotal > 0 ? (total / maxTotal) * 100 : 0;

          const directRows = [
            { label: "Cash", value: Number(s.cash_sales) },
            { label: "UPI", value: Number(s.upi_sales) },
            { label: "Card", value: Number(s.card_sales) },
          ].filter((r) => r.value > 0);

          const platformRows = [
            { label: "Zomato Gold", value: Number(s.zomato_gold_sales) },
            { label: "Zomato", value: Number(s.zomato_sales) },
            { label: "Swiggy", value: Number(s.swiggy_sales) },
            { label: "Swiggy Dineout", value: Number(s.swiggy_dineout_sales) },
            { label: "EazyDiner", value: Number(s.eazy_diner_sales) },
          ].filter((r) => r.value > 0);

          const directSum = getDirectTotal(s);
          const platformSum = getPlatformTotal(s);

          return (
            <div key={s.date} className={isOpen ? "bg-bg-elevated/20" : ""}>
              {/* Row header */}
              <button
                type="button"
                onClick={() => setOpenDate(isOpen ? null : s.date)}
                className={`w-full text-left transition-colors ${
                  isOpen ? "" : "hover:bg-bg-elevated/30 active:bg-bg-elevated/50"
                }`}
              >
                {/* Relative bar */}
                <div className="h-[3px] bg-transparent">
                  <div
                    className={`h-full transition-all duration-700 ${
                      isToday ? "bg-success/50" : isYesterday ? "bg-warm/40" : "bg-border"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex items-center gap-3 px-4 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-bold text-content-primary">
                        {formatDateLabel(s.date)}
                      </span>
                      {isToday && (
                        <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success">
                          Today
                        </span>
                      )}
                      {isYesterday && (
                        <span className="rounded-full bg-warm/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-warm">
                          Yesterday
                        </span>
                      )}
                    </div>
                    {s.total_bills > 0 && (
                      <p className="mt-0.5 text-xs text-content-secondary">
                        {s.total_bills} bills
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`font-mono text-base font-bold tabular-nums ${
                      isToday ? "text-success" : "text-warm"
                    }`}>
                      {formatINR(total)}
                    </span>
                    {isEditable && (
                      <a
                        href={`/sales?date=${s.date}&edit=1`}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-lg p-1.5 text-content-secondary hover:bg-white/[0.08] hover:text-content-primary transition-colors"
                        title="Edit sales"
                      >
                        <Pencil className="size-3.5" />
                      </a>
                    )}
                    <ChevronDown
                      className={`size-4 shrink-0 text-content-secondary transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </div>
              </button>

              {/* Expanded breakdown */}
              {isOpen && (
                <div className="border-t border-border/60 px-4 pb-4 pt-3 space-y-2.5">
                  {/* Direct Sales */}
                  {directRows.length > 0 && (
                    <div className="overflow-hidden rounded-xl border border-border">
                      <div className="flex items-center justify-between bg-bg-elevated px-3 py-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-content-secondary">
                          Direct
                        </span>
                        <span className="font-mono text-xs font-bold tabular-nums text-content-secondary">
                          {formatINR(directSum)}
                        </span>
                      </div>
                      {directRows.map((r, i) => (
                        <div
                          key={r.label}
                          className={`flex items-center justify-between px-3 py-2.5 text-sm ${
                            i > 0 ? "border-t border-border/50" : ""
                          }`}
                        >
                          <span className="text-content-secondary">{r.label}</span>
                          <span className="font-mono font-semibold tabular-nums text-content-primary">
                            {formatINR(r.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Platform Sales */}
                  {platformRows.length > 0 && (
                    <div className="overflow-hidden rounded-xl border border-border">
                      <div className="flex items-center justify-between bg-bg-elevated px-3 py-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-content-secondary">
                          Platform
                        </span>
                        <span className="font-mono text-xs font-bold tabular-nums text-content-secondary">
                          {formatINR(platformSum)}
                        </span>
                      </div>
                      {platformRows.map((r, i) => (
                        <div
                          key={r.label}
                          className={`flex items-center justify-between px-3 py-2.5 text-sm ${
                            i > 0 ? "border-t border-border/50" : ""
                          }`}
                        >
                          <span className="text-content-secondary">{r.label}</span>
                          <span className="font-mono font-semibold tabular-nums text-content-primary">
                            {formatINR(r.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Closing Balance */}
                  {Number(s.closing_balance) > 0 && (
                    <div className="flex items-center justify-between rounded-xl bg-warm/10 px-4 py-3">
                      <span className="text-sm font-bold text-warm">Closing Balance</span>
                      <span className="font-mono text-base font-bold tabular-nums text-warm">
                        {formatINR(s.closing_balance)}
                      </span>
                    </div>
                  )}

                  {/* Bill stats */}
                  {s.total_bills > 0 && (
                    <div className="flex items-center justify-center gap-1.5 py-1 text-xs text-content-secondary">
                      <Receipt className="size-3.5" />
                      <span>
                        {s.total_bills} bills · avg{" "}
                        <span className="font-semibold text-content-primary">
                          {formatINR(Math.round(total / s.total_bills))}
                        </span>{" "}
                        / bill
                      </span>
                    </div>
                  )}

                  {/* Discounts / comp */}
                  {(Number(s.discount_amount) > 0 || Number(s.complimentary_count) > 0) && (
                    <div className="flex items-center justify-between rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-xs text-content-secondary">
                      <span>Discounts & comp</span>
                      <span className="font-mono font-semibold tabular-nums">
                        {Number(s.discount_amount) > 0 && `₹${Math.round(Number(s.discount_amount)).toLocaleString("en-IN")} off`}
                        {Number(s.discount_amount) > 0 && Number(s.complimentary_count) > 0 && " · "}
                        {Number(s.complimentary_count) > 0 && `${s.complimentary_count} comp`}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
