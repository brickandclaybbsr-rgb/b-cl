import { CircleCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatINR, formatNumber } from "@/lib/utils";
import { formatTimeIST } from "@/lib/date";
import { salesTotal } from "@/lib/data/sales";
import type { DailySales } from "@/lib/database.types";

export function SalesView({
  sales,
  submitterName,
}: {
  sales: DailySales;
  submitterName: string;
}) {
  const total = salesTotal(sales);

  return (
    <div className="space-y-4">
      <Card className="flex items-center gap-3 border-success/30 bg-success/10 p-4">
        <CircleCheck className="size-6 shrink-0 text-success" />
        <div>
          <p className="font-semibold text-success">Sales recorded</p>
          <p className="text-xs text-content-secondary">
            By {submitterName} · {formatTimeIST(sales.submitted_at)}
          </p>
        </div>
      </Card>

      {/* Grand total */}
      <div className="flex items-center justify-between rounded-xl bg-fire/10 px-4 py-3">
        <span className="text-sm font-semibold text-warm">Total Sales</span>
        <span className="font-mono text-xl font-bold tabular-nums text-warm">
          {formatINR(total)}
        </span>
      </div>

      {/* Opening / Closing */}
      <Card className="divide-y divide-border">
        <SectionHeader label="Opening / Closing" />
        <Line label="Opening Cash" value={formatINR(sales.opening_cash)} />
        <Line label="Closing Balance" value={formatINR(sales.closing_balance)} />
      </Card>

      {/* Direct Sales */}
      <Card className="divide-y divide-border">
        <SectionHeader label="Direct Sales" />
        <Line label="Cash Sale" value={formatINR(sales.cash_sales)} />
        <Line label="Card" value={formatINR(sales.card_sales)} />
        <Line label="UPI" value={formatINR(sales.upi_sales)} />
      </Card>

      {/* Aggregators */}
      <Card className="divide-y divide-border">
        <SectionHeader label="Aggregators" />
        <Line label="Zomato Gold (Dine In)" value={formatINR(sales.zomato_gold_sales)} />
        <Line label="Zomato" value={formatINR(sales.zomato_sales)} />
        <Line label="Swiggy" value={formatINR(sales.swiggy_sales)} />
        <Line label="Swiggy Dineout" value={formatINR(sales.swiggy_dineout_sales)} />
        <Line label="EazyDiner" value={formatINR(sales.eazy_diner_sales)} />
      </Card>

      {/* Discounts / Comp */}
      {(sales.discount_amount > 0 || sales.complimentary_count > 0) && (
        <Card className="divide-y divide-border">
          <SectionHeader label="Discounts / Complimentary" />
          {sales.discount_amount > 0 && (
            <Line label="Discount Given" value={formatINR(sales.discount_amount)} muted />
          )}
          {sales.complimentary_count > 0 && (
            <Line
              label="Complimentary"
              value={`${formatNumber(sales.complimentary_count)} meals · ${formatINR(sales.complimentary_value)}`}
              muted
            />
          )}
        </Card>
      )}

      {sales.notes && (
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-content-secondary">
            Notes
          </p>
          <p className="mt-1 text-sm">{sales.notes}</p>
        </Card>
      )}
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="px-4 py-2.5">
      <p className="text-xs font-bold uppercase tracking-wider text-content-secondary">{label}</p>
    </div>
  );
}

function Line({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-content-secondary">{label}</span>
      <span
        className={`font-mono text-sm tabular-nums ${
          muted ? "text-content-secondary" : "font-semibold text-content-primary"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
