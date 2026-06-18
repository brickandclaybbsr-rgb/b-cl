import { CircleCheck, Receipt, Tag } from "lucide-react";
import { formatINR, formatNumber } from "@/lib/utils";
import { formatTimeIST } from "@/lib/date";
import { salesTotal } from "@/lib/data/sales";
import type { DailySales } from "@/lib/database.types";

export function SalesView({
  sales,
  submitterName,
  showHeader = true,
}: {
  sales: DailySales;
  submitterName: string;
  showHeader?: boolean;
}) {
  const total = salesTotal(sales);
  const directTotal =
    Number(sales.cash_sales) + Number(sales.upi_sales) + Number(sales.card_sales);
  const platformTotal =
    Number(sales.zomato_gold_sales) + Number(sales.zomato_sales) +
    Number(sales.swiggy_sales) + Number(sales.swiggy_dineout_sales) +
    Number(sales.eazy_diner_sales);

  const directRows = [
    { label: "Cash", value: Number(sales.cash_sales) },
    { label: "UPI", value: Number(sales.upi_sales) },
    { label: "Card", value: Number(sales.card_sales) },
  ].filter((r) => r.value > 0);

  const platformRows = [
    { label: "Zomato Gold (Dine In)", value: Number(sales.zomato_gold_sales) },
    { label: "Zomato", value: Number(sales.zomato_sales) },
    { label: "Swiggy", value: Number(sales.swiggy_sales) },
    { label: "Swiggy Dineout", value: Number(sales.swiggy_dineout_sales) },
    { label: "EazyDiner", value: Number(sales.eazy_diner_sales) },
  ].filter((r) => r.value > 0);

  return (
    <div className="space-y-3">
      {/* Submitted banner */}
      {showHeader && (
        <div className="flex items-center gap-3 rounded-xl border border-success/25 bg-success/10 px-4 py-3">
          <CircleCheck className="size-5 shrink-0 text-success" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-success">Sales recorded</p>
            <p className="text-xs text-content-secondary">
              By {submitterName} · {formatTimeIST(sales.submitted_at)}
            </p>
          </div>
        </div>
      )}

      {/* Grand total */}
      <div className="rounded-xl bg-warm/10 px-4 py-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-warm/70">
          Total Sales
        </p>
        <p className="mt-1 font-mono text-3xl font-bold tabular-nums text-warm">
          {formatINR(total)}
        </p>
        {sales.total_bills > 0 && (
          <p className="mt-1 text-xs text-warm/60">
            {sales.total_bills} bills · avg{" "}
            {formatINR(Math.round(total / sales.total_bills))} / bill
          </p>
        )}
      </div>

      {/* Opening / Closing */}
      <div className="overflow-hidden rounded-2xl border border-border">
        <GroupHeader label="Cash Position" />
        <DetailRow label="Opening Cash" value={formatINR(sales.opening_cash)} />
        <DetailRow
          label="Closing Balance"
          value={formatINR(sales.closing_balance)}
          highlight
        />
      </div>

      {/* Direct Sales */}
      {directRows.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border">
          <GroupHeader label="Direct Sales" sub={formatINR(directTotal)} />
          {directRows.map((r) => (
            <DetailRow key={r.label} label={r.label} value={formatINR(r.value)} />
          ))}
        </div>
      )}

      {/* Platform Sales */}
      {platformRows.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border">
          <GroupHeader label="Platform Sales" sub={formatINR(platformTotal)} />
          {platformRows.map((r) => (
            <DetailRow key={r.label} label={r.label} value={formatINR(r.value)} />
          ))}
        </div>
      )}

      {/* Discounts / Comp */}
      {(Number(sales.discount_amount) > 0 || Number(sales.complimentary_count) > 0) && (
        <div className="overflow-hidden rounded-2xl border border-border">
          <GroupHeader label="Discounts & Complimentary" />
          {Number(sales.discount_amount) > 0 && (
            <DetailRow
              label="Discount Given"
              value={formatINR(sales.discount_amount)}
              muted
              icon={<Tag className="size-3.5" />}
            />
          )}
          {Number(sales.complimentary_count) > 0 && (
            <DetailRow
              label="Complimentary"
              value={`${formatNumber(sales.complimentary_count)} meals · ${formatINR(sales.complimentary_value)}`}
              muted
              icon={<Receipt className="size-3.5" />}
            />
          )}
        </div>
      )}

      {/* Notes */}
      {sales.notes && (
        <div className="rounded-2xl border border-border px-4 py-3">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-content-secondary">
            Notes
          </p>
          <p className="text-sm text-content-primary">{sales.notes}</p>
        </div>
      )}
    </div>
  );
}

function GroupHeader({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between bg-bg-elevated px-4 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-content-secondary">
        {label}
      </p>
      {sub && (
        <span className="font-mono text-xs font-bold tabular-nums text-content-secondary">
          {sub}
        </span>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
  muted,
  highlight,
  icon,
}: {
  label: string;
  value: string;
  muted?: boolean;
  highlight?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-center justify-between border-t border-border/60 px-4 py-3 ${
        highlight ? "bg-warm/5" : ""
      }`}
    >
      <div className="flex items-center gap-2 text-sm">
        {icon && <span className="text-content-secondary">{icon}</span>}
        <span className={muted ? "text-content-secondary" : "text-content-secondary"}>
          {label}
        </span>
      </div>
      <span
        className={`font-mono text-sm tabular-nums ${
          highlight
            ? "font-bold text-warm"
            : muted
            ? "text-content-secondary"
            : "font-semibold text-content-primary"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
