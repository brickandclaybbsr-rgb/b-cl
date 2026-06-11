import { createClient } from "@/lib/supabase/server";
import { getProfileNameMap } from "@/lib/data/profiles";
import type { Vendor, VendorOrder, OrderStatus } from "@/lib/database.types";

export type VendorOrderView = VendorOrder & {
  vendor_name: string;
  raised_by_name: string;
};

export async function getVendors(): Promise<Vendor[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("vendors")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });
  return data ?? [];
}

export async function getAllVendors(): Promise<Vendor[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("vendors")
    .select("*")
    .order("name", { ascending: true });
  return data ?? [];
}

/** Orders with vendor + raiser names resolved (manual join to keep types simple). */
export async function getOrders(
  statuses?: OrderStatus[],
): Promise<VendorOrderView[]> {
  const supabase = createClient();
  let query = supabase
    .from("vendor_orders")
    .select("*")
    .order("raised_at", { ascending: false });
  if (statuses && statuses.length) query = query.in("status", statuses);

  const { data: orders } = await query;
  if (!orders || orders.length === 0) return [];

  const [{ data: vendors }, nameMap] = await Promise.all([
    supabase.from("vendors").select("id, name"),
    getProfileNameMap(),
  ]);
  const vendorMap: Record<string, string> = {};
  (vendors ?? []).forEach((v) => (vendorMap[v.id] = v.name));

  return orders.map((o) => ({
    ...o,
    vendor_name: o.vendor_id ? vendorMap[o.vendor_id] ?? "Unknown vendor" : "—",
    raised_by_name: o.raised_by ? nameMap[o.raised_by] ?? "Staff" : "Staff",
  }));
}

export async function countPendingOrders(): Promise<number> {
  const supabase = createClient();
  const { count } = await supabase
    .from("vendor_orders")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  return count ?? 0;
}
