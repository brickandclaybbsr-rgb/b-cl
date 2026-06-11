import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, StockLine } from "@/lib/database.types";
import { formatDateLabel } from "@/lib/date";
import { formatINR, formatNumber } from "@/lib/utils";

type Client = SupabaseClient<Database>;

export interface ReportData {
  date: string;
  sales: {
    cash: number;
    online: number;
    aggregator: number;
    total: number;
    bills: number;
    avg: number;
  } | null;
  openingDone: boolean;
  closingDone: boolean;
  low: string[];
  out: string[];
  pendingOrders: { vendor: string; items: string }[];
  notes: string[];
}

/** Gather everything the report needs for a given business date. */
export async function gatherReportData(
  client: Client,
  date: string,
): Promise<ReportData> {
  const [opening, closing, sales, stock, orders] = await Promise.all([
    client.from("opening_checklists").select("notes").eq("date", date).maybeSingle(),
    client.from("closing_checklists").select("notes").eq("date", date).maybeSingle(),
    client.from("daily_sales").select("*").eq("date", date).maybeSingle(),
    client
      .from("stock_snapshots")
      .select("items")
      .order("date", { ascending: false })
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    client
      .from("vendor_orders")
      .select("items, vendor_id")
      .eq("status", "pending")
      .order("raised_at", { ascending: false }),
  ]);

  // sales
  const s = sales.data;
  const salesData = s
    ? (() => {
        const total =
          Number(s.cash_sales) + Number(s.online_sales) + Number(s.aggregator_sales);
        return {
          cash: Number(s.cash_sales),
          online: Number(s.online_sales),
          aggregator: Number(s.aggregator_sales),
          total,
          bills: Number(s.total_bills),
          avg: s.total_bills > 0 ? total / s.total_bills : 0,
        };
      })()
    : null;

  // stock alerts
  const items: StockLine[] = stock.data?.items ?? [];
  const low = items.filter((i) => i.status === "low").map((i) => i.item_name);
  const out = items.filter((i) => i.status === "out").map((i) => i.item_name);

  // pending orders → resolve vendor names
  let pendingOrders: { vendor: string; items: string }[] = [];
  const orderRows = orders.data ?? [];
  if (orderRows.length) {
    const { data: vendors } = await client.from("vendors").select("id, name");
    const vmap: Record<string, string> = {};
    (vendors ?? []).forEach((v) => (vmap[v.id] = v.name));
    pendingOrders = orderRows.map((o) => ({
      vendor: o.vendor_id ? vmap[o.vendor_id] ?? "Vendor" : "Vendor",
      items: o.items,
    }));
  }

  const notes = [s?.notes, opening.data?.notes, closing.data?.notes]
    .map((n) => (n ?? "").trim())
    .filter(Boolean);

  return {
    date,
    sales: salesData,
    openingDone: Boolean(opening.data),
    closingDone: Boolean(closing.data),
    low,
    out,
    pendingOrders,
    notes,
  };
}

/** Render the WhatsApp message text from gathered data. */
export function formatReportText(d: ReportData): string {
  const L: string[] = [];
  L.push("🍕 *Brick & Clay — Daily Report*");
  L.push(`📅 ${formatDateLabel(d.date)}`);
  L.push("");

  L.push("💰 *SALES SUMMARY*");
  if (d.sales) {
    L.push(`Cash: ${formatINR(d.sales.cash)}`);
    L.push(`Online: ${formatINR(d.sales.online)}`);
    L.push(`Swiggy/Zomato: ${formatINR(d.sales.aggregator)}`);
    L.push(`*Total: ${formatINR(d.sales.total)}*`);
    L.push(`Bills: ${formatNumber(d.sales.bills)} | Avg: ${formatINR(d.sales.avg)}`);
  } else {
    L.push("_No sales entered today._");
  }
  L.push("");

  L.push("✅ *CHECKLISTS*");
  L.push(`Opening: ${d.openingDone ? "Done ✅" : "Pending ❌"}`);
  L.push(`Closing: ${d.closingDone ? "Done ✅" : "Pending ❌"}`);
  L.push("");

  L.push("📦 *STOCK ALERTS*");
  L.push(`Low: ${d.low.length ? d.low.join(", ") : "None"}`);
  L.push(`Out of Stock: ${d.out.length ? d.out.join(", ") : "None"}`);
  L.push("");

  L.push("🛒 *PENDING ORDERS*");
  if (d.pendingOrders.length) {
    d.pendingOrders.forEach((o) => L.push(`${o.vendor} — ${o.items}`));
  } else {
    L.push("None");
  }
  L.push("");

  if (d.notes.length) {
    L.push("📝 *NOTES*");
    d.notes.forEach((n) => L.push(n));
    L.push("");
  }

  L.push("_Sent automatically by B&C Ops_");
  return L.join("\n");
}
