import { createClient } from "@/lib/supabase/server";
import type { StockItem, StockSnapshot, StockLine } from "@/lib/database.types";

export async function getStockItems(): Promise<StockItem[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("stock_items")
    .select("*")
    .eq("is_active", true)
    .order("category", { ascending: true })
    .order("name", { ascending: true });
  return data ?? [];
}

/** All stock items (incl. inactive) for owner config screens. */
export async function getAllStockItems(): Promise<StockItem[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("stock_items")
    .select("*")
    .order("category", { ascending: true })
    .order("name", { ascending: true });
  return data ?? [];
}

/** The most recent stock snapshot (any day) = current status. */
export async function getLatestStockSnapshot(): Promise<StockSnapshot | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("stock_snapshots")
    .select("*")
    .order("date", { ascending: false })
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

/** Get stock snapshot for a specific date (usually today). */
export async function getStockSnapshotForDate(date: string): Promise<StockSnapshot | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("stock_snapshots")
    .select("*")
    .eq("date", date)
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

/** Items needing reorder (low / out) from a snapshot. */
export function orderListFromSnapshot(snapshot: StockSnapshot | null): StockLine[] {
  if (!snapshot) return [];
  return snapshot.items.filter((i) => i.status === "low" || i.status === "out");
}

/** Map of item_id → current status from the latest snapshot. */
export function statusMap(snapshot: StockSnapshot | null): Record<string, StockLine> {
  const map: Record<string, StockLine> = {};
  (snapshot?.items ?? []).forEach((i) => {
    map[i.item_id] = i;
  });
  return map;
}

/** Last N snapshots newest-first — used to compute consumption trends. */
export async function getRecentSnapshots(limit = 7): Promise<StockSnapshot[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("stock_snapshots")
    .select("*")
    .order("date", { ascending: false })
    .order("submitted_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

/**
 * Average daily consumption per item (units/day) calculated from snapshot history.
 * Only counts days where stock decreased (positive consumption).
 * Returns Record<item_id, avgDailyUnits>
 */
export function computeConsumptionMap(snapshots: StockSnapshot[]): Record<string, number> {
  if (snapshots.length < 2) return {};

  // Collect qty data points per item from all snapshots
  const byItem: Record<string, { date: string; qty: number }[]> = {};
  for (const snap of snapshots) {
    for (const line of snap.items) {
      if (line.current_qty !== undefined && line.current_qty !== null) {
        if (!byItem[line.item_id]) byItem[line.item_id] = [];
        byItem[line.item_id].push({ date: snap.date, qty: line.current_qty });
      }
    }
  }

  const result: Record<string, number> = {};
  for (const [itemId, points] of Object.entries(byItem)) {
    if (points.length < 2) continue;
    // Sort oldest → newest
    points.sort((a, b) => a.date.localeCompare(b.date));

    let totalConsumed = 0;
    let intervals = 0;
    for (let i = 1; i < points.length; i++) {
      const consumed = points[i - 1].qty - points[i].qty; // positive = consumed
      if (consumed > 0) {
        totalConsumed += consumed;
        intervals++;
      }
    }
    if (intervals > 0) {
      result[itemId] = Math.round((totalConsumed / intervals) * 100) / 100;
    }
  }
  return result;
}
