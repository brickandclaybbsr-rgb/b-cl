"use client";

import { useState } from "react";
import { ChevronDown, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatINR } from "@/lib/utils";
import { formatDateLabel } from "@/lib/date";
import type { DailySales } from "@/lib/database.types";

interface Props {
  sales: DailySales[];
  today: string;
  yesterday: string;
  canEdit: boolean;
}

function salesTotal(s: DailySales) {
  return (
    Number(s.cash_sales) +
    Number(s.upi_sales) +
    Number(s.card_sales) +
    Number(s.zomato_gold_sales) +
    Number(s.zomato_sales) +
    Number(s.swiggy_sales) +
    Number(s.swiggy_dineout_sales) +
    Number(s.eazy_diner_sales)
  );
}

export function Last7DaysAccordion({ sales, today, yesterday, canEdit }: Props) {
  const [openDate, setOpenDate] = useState<string | null>(null);

  if (sales.length === 0) return null;

  return (
    <Card className="divide-y divide-border overflow-hidden">
      {sales.map((s) => {
        const total = salesTotal(s);
        const isOpen = openDate === s.date;
        const isEditable = canEdit && (s.date === today || s.date === yesterday);

        const detailRows = [
          { label: "Cash", value: Number(s.cash_sales) },
          { label: "UPI", value: Number(s.upi_sales) },
          { label: "Card", value: Number(s.card_sales) },
          { label: "Zomato Gold", value: Number(s.zomato_gold_sales) },
          { label: "Zomato", value: Number(s.zomato_sales) },
          { label: "Swiggy", value: Number(s.swiggy_sales) },
          { label: "Swiggy Dineout", value: Number(s.swiggy_dineout_sales) },
          { label: "EazyDiner", value: Number(s.eazy_diner_sales) },
        ].filter((r) => r.value > 0);

        return (
          <div key={s.date}>
            <button
              type="button"
              onClick={() => setOpenDate(isOpen ? null : s.date)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] active:bg-white/[0.04] transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <ChevronDown
                  className={`size-4 text-content-secondary transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
                <p className="text-sm font-semibold text-content-primary">
                  {formatDateLabel(s.date)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold tabular-nums text-warm">
                  {formatINR(total)}
                </span>
                {isEditable && (
                  <a
                    href={`/sales?date=${s.date}&edit=1`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-lg hover:bg-white/[0.08] text-content-secondary hover:text-content-primary transition-colors"
                    title="Edit sales"
                  >
                    <Pencil className="size-3.5" />
                  </a>
                )}
              </div>
            </button>

            {isOpen && (
              <div className="px-4 pb-3 pt-1 bg-bg-elevated/30">
                {detailRows.length > 0 && (
                  <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
                    {detailRows.map((r) => (
                      <div
                        key={r.label}
                        className="flex items-center justify-between px-3 py-2 text-sm"
                      >
                        <span className="text-content-secondary">{r.label}</span>
                        <span className="font-mono font-semibold tabular-nums text-content-primary">
                          {formatINR(r.value)}
                        </span>
                      </div>
                    ))}
                    {Number(s.closing_balance) > 0 && (
                      <div className="flex items-center justify-between px-3 py-2 text-sm bg-bg-elevated/60">
                        <span className="font-semibold text-content-primary">Closing Balance</span>
                        <span className="font-mono font-bold tabular-nums text-content-primary">
                          {formatINR(s.closing_balance)}
                        </span>
                      </div>
                    )}
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
