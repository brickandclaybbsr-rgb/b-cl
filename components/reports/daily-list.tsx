"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatDateLabel } from "@/lib/date";
import { formatINR } from "@/lib/utils";
import type { DaySummary } from "@/lib/data/reports";

const CATEGORY_LABELS: Record<string, string> = {
  withdrawal: "Withdrawal",
  advance: "Advance",
  expense: "Expense",
  other: "Other",
};

export function DailyList({ days }: { days: DaySummary[] }) {
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  return (
    <Card className="divide-y divide-border">
      {days.map((d) => {
        const isExpanded = expandedDate === d.date;
        const s = d.sales;

        return (
          <div key={d.date}>
            {/* Row */}
            <button
              type="button"
              onClick={() => setExpandedDate(isExpanded ? null : d.date)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.02]"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{formatDateLabel(d.date)}</p>
                <p className="text-xs text-content-secondary">
                  {d.hasSales ? "Sales recorded" : "No sales entry"}
                  {d.cashOutTotal > 0 && (
                    <span className="ml-1.5 text-danger">· -{formatINR(d.cashOutTotal)} out</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Tick ok={d.openingDone} title="Opening" letter="O" />
                <Tick ok={d.closingDone} title="Closing" letter="C" />
              </div>
              <span className="w-24 text-right font-mono text-sm font-semibold tabular-nums">
                {formatINR(d.total)}
              </span>
              {d.hasSales ? (
                isExpanded ? (
                  <ChevronUp className="size-4 shrink-0 text-content-secondary" />
                ) : (
                  <ChevronDown className="size-4 shrink-0 text-content-secondary" />
                )
              ) : (
                <span className="size-4 shrink-0" />
              )}
            </button>

            {/* Expanded platform breakdown */}
            {isExpanded && s && (
              <div className="border-t border-border/40 bg-bg-elevated/30 px-4 py-3 space-y-3">
                {/* Opening / Closing cash */}
                <div className="grid grid-cols-2 gap-2">
                  <MiniStat label="Opening Cash" value={s.opening_cash} />
                  <MiniStat label="Closing Balance" value={s.closing_balance} />
                </div>

                {/* Direct sales */}
                <div>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-content-secondary">
                    Direct Sales
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <MiniStat label="Cash" value={s.cash_sales} highlight />
                    <MiniStat label="Card" value={s.card_sales} />
                    <MiniStat label="UPI" value={s.upi_sales} />
                  </div>
                </div>

                {/* Aggregators */}
                <div>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-content-secondary">
                    Aggregators
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <MiniStat label="Zomato Gold" value={s.zomato_gold_sales} />
                    <MiniStat label="Zomato" value={s.zomato_sales} />
                    <MiniStat label="Swiggy" value={s.swiggy_sales} />
                    <MiniStat label="Swiggy Dineout" value={s.swiggy_dineout_sales} />
                    <MiniStat label="EazyDiner" value={s.eazy_diner_sales} />
                  </div>
                </div>

                {/* Discounts / notes */}
                {(s.discount_amount > 0 || s.complimentary_count > 0 || s.notes) && (
                  <div className="border-t border-border/40 pt-2.5 space-y-1.5 text-xs text-content-secondary">
                    {s.discount_amount > 0 && (
                      <p>Discount given: <span className="font-semibold text-content-primary">{formatINR(s.discount_amount)}</span></p>
                    )}
                    {s.complimentary_count > 0 && (
                      <p>Complimentary: <span className="font-semibold text-content-primary">{s.complimentary_count} meals · {formatINR(s.complimentary_value)}</span></p>
                    )}
                    {s.notes && (
                      <p>Notes: <span className="font-semibold text-content-primary">{s.notes}</span></p>
                    )}
                  </div>
                )}

                {/* Total summary row */}
                <div className="flex items-center justify-between rounded-lg bg-fire/8 border border-fire/15 px-3 py-2">
                  <span className="text-xs font-bold text-warm">Total Sales</span>
                  <span className="font-mono text-base font-bold tabular-nums text-warm">
                    {formatINR(d.total)}
                  </span>
                </div>

                {/* Cash Out */}
                {d.cashOut.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-content-secondary flex items-center gap-1">
                        <Wallet className="size-3" /> Cash Out
                      </p>
                      <span className="font-mono text-xs font-bold text-danger">
                        -{formatINR(d.cashOutTotal)}
                      </span>
                    </div>
                    <div className="rounded-lg border border-border/30 divide-y divide-border/20 overflow-hidden">
                      {d.cashOut.map((e) => (
                        <div key={e.id} className="flex items-center justify-between px-3 py-2 text-xs">
                          <div className="min-w-0 flex-1">
                            <span className="font-medium text-content-primary">{e.person_name}</span>
                            <span className="ml-1.5 text-content-secondary">
                              · {CATEGORY_LABELS[e.category] ?? e.category}
                              {e.notes ? ` · ${e.notes}` : ""}
                            </span>
                          </div>
                          <span className="ml-3 shrink-0 font-mono font-semibold tabular-nums text-danger">
                            -{formatINR(Number(e.amount))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </Card>
  );
}

function MiniStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  if (!value && value !== 0) return null;
  return (
    <div className="rounded-lg border border-border/30 bg-white/[0.02] px-2.5 py-2">
      <p className="text-[10px] text-content-secondary">{label}</p>
      <p className={`font-mono text-sm font-semibold tabular-nums ${highlight ? "text-warm" : "text-content-primary"}`}>
        {formatINR(value)}
      </p>
    </div>
  );
}

function Tick({ ok, title, letter }: { ok: boolean; title: string; letter: string }) {
  return (
    <span
      title={`${title}: ${ok ? "done" : "missing"}`}
      className={`flex size-6 items-center justify-center rounded-md text-[0.65rem] font-bold ${
        ok ? "bg-success/15 text-success" : "bg-bg-elevated text-content-secondary"
      }`}
    >
      {ok ? <Check className="size-3.5" strokeWidth={3} /> : letter}
    </span>
  );
}
