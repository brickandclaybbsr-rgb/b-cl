import { createClient } from "@/lib/supabase/server";
import { getProfileNameMap } from "@/lib/data/profiles";
import type { Purchase } from "@/lib/database.types";

export type PurchaseView = Purchase & {
  vendor_name: string;
  submitted_by_name: string;
};

export async function getPurchases(): Promise<PurchaseView[]> {
  const supabase = createClient();
  const { data: purchases } = await supabase
    .from("purchases")
    .select("*")
    .order("purchased_at", { ascending: false });

  if (!purchases || purchases.length === 0) return [];

  const [{ data: vendors }, nameMap] = await Promise.all([
    supabase.from("vendors").select("id, name"),
    getProfileNameMap(),
  ]);

  const vendorMap: Record<string, string> = {};
  (vendors ?? []).forEach((v) => (vendorMap[v.id] = v.name));

  return purchases.map((p) => ({
    ...p,
    vendor_name: p.vendor_id ? vendorMap[p.vendor_id] ?? "Unknown vendor" : "—",
    submitted_by_name: p.submitted_by ? nameMap[p.submitted_by] ?? "Staff" : "Staff",
  }));
}
