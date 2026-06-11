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
