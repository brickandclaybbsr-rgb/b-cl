import { createClient } from "@/lib/supabase/server";
import { getProfileNameMap } from "@/lib/data/profiles";
import { todayIST } from "@/lib/date";

export interface ActivityEvent {
  at: string;
  actor: string;
  action: string;
  kind: "opening" | "closing" | "sales" | "stock" | "order";
}

/** Today's activity timeline (newest first) for the owner dashboard. */
export async function getTodayActivity(): Promise<ActivityEvent[]> {
  const supabase = createClient();
  const date = todayIST();
  const names = await getProfileNameMap();
  const name = (id: string | null) => (id ? names[id] ?? "Staff" : "Staff");

  const [opening, closing, sales, stock, orders] = await Promise.all([
    supabase
      .from("opening_checklists")
      .select("submitted_by, submitted_at")
      .eq("date", date),
    supabase
      .from("closing_checklists")
      .select("submitted_by, submitted_at")
      .eq("date", date),
    supabase
      .from("daily_sales")
      .select("submitted_by, submitted_at")
      .eq("date", date),
    supabase
      .from("stock_snapshots")
      .select("submitted_by, submitted_at")
      .eq("date", date),
    supabase
      .from("vendor_orders")
      .select("raised_by, raised_at")
      .gte("raised_at", `${date}T00:00:00`),
  ]);

  const events: ActivityEvent[] = [];

  (opening.data ?? []).forEach((r) =>
    events.push({
      at: r.submitted_at,
      actor: name(r.submitted_by),
      action: "submitted the opening checklist",
      kind: "opening",
    }),
  );
  (closing.data ?? []).forEach((r) =>
    events.push({
      at: r.submitted_at,
      actor: name(r.submitted_by),
      action: "submitted the closing checklist",
      kind: "closing",
    }),
  );
  (sales.data ?? []).forEach((r) =>
    events.push({
      at: r.submitted_at,
      actor: name(r.submitted_by),
      action: "recorded daily sales",
      kind: "sales",
    }),
  );
  (stock.data ?? []).forEach((r) =>
    events.push({
      at: r.submitted_at,
      actor: name(r.submitted_by),
      action: "updated stock status",
      kind: "stock",
    }),
  );
  (orders.data ?? []).forEach((r) =>
    events.push({
      at: r.raised_at,
      actor: name(r.raised_by),
      action: "raised a vendor order",
      kind: "order",
    }),
  );

  return events.sort((a, b) => (a.at < b.at ? 1 : -1));
}
