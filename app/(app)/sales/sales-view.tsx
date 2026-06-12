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

      <Card className="p-5 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-content-secondary">
          Total sales
        </p>
        <p className="mt-1 font-mono text-4xl font-bold tabular-nums text-warm">
          {formatINR(total)}
        </p>
      </Card>

      <Card className="divide-y divide-border">
        <Line label="Cash" value={formatINR(sales.cash_sales)} />
        <Line label="Online (UPI / Card)" value={formatINR(sales.online_sales)} />
        <Line label="Zomato / Swiggy" value={formatINR(sales.aggregator_sales)} />
        <Line label="Discount given" value={formatINR(sales.discount_amount)} muted />
        <Line
          label="Complimentary"
          value={`${formatNumber(sales.complimentary_count)} · ${formatINR(
            sales.complimentary_value,
          )}`}
          muted
        />
      </Card>

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
