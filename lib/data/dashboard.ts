import { todayIST } from "@/lib/date";
import { getOpeningChecklist, getClosingChecklist } from "@/lib/data/checklists";
import { getSales, salesTotal } from "@/lib/data/sales";
import {
  getLatestStockSnapshot,
  orderListFromSnapshot,
} from "@/lib/data/stock";
import { countPendingOrders } from "@/lib/data/vendors";
import type {
  OpeningChecklist,
  ClosingChecklist,
  DailySales,
  StockSnapshot,
  StockLine,
} from "@/lib/database.types";

export interface TodaySnapshot {
  date: string;
  /** Legacy: first opening record found (used by staff dashboard). */
  opening: OpeningChecklist | null;
  /** Legacy: first closing record found (used by staff dashboard). */
  closing: ClosingChecklist | null;
  /** Per-team opening records — populated for the owner dashboard. */
  openingKitchen: OpeningChecklist | null;
  openingFrontDesk: OpeningChecklist | null;
  /** Per-team closing records — populated for the owner dashboard. */
  closingKitchen: ClosingChecklist | null;
  closingFrontDesk: ClosingChecklist | null;
  sales: DailySales | null;
  salesTotal: number;
  stockSnapshot: StockSnapshot | null;
  lowItems: StockLine[];
  outItems: StockLine[];
  pendingOrders: number;
}

/** Aggregates everything the dashboards need for today's IST business date.
 *
 *  - Pass `team` for the staff dashboard so they only see their own team's state.
 *  - Pass no argument (or `undefined`) for the owner dashboard — this fetches
 *    BOTH kitchen and front_desk records separately so every team's status is
 *    visible regardless of submission order. */
export async function getTodaySnapshot(
  team?: "kitchen" | "front_desk" | null,
): Promise<TodaySnapshot> {
  const date = todayIST();

  // For the owner view (no team filter) we fetch all four records in parallel.
  // For staff we only need their own team's record.
  const isOwnerView = team === undefined || team === null;

  const [
    opening,
    closing,
    openingKitchen,
    openingFrontDesk,
    closingKitchen,
    closingFrontDesk,
    sales,
    stockSnapshot,
    pendingOrders,
  ] = await Promise.all([
    // Legacy single record — still used by the staff dashboard path
    getOpeningChecklist(date, team ?? undefined),
    getClosingChecklist(date, team ?? undefined),
    // Per-team records — only fetched when owner view (avoids extra queries for staff)
    isOwnerView ? getOpeningChecklist(date, "kitchen") : Promise.resolve(null),
    isOwnerView ? getOpeningChecklist(date, "front_desk") : Promise.resolve(null),
    isOwnerView ? getClosingChecklist(date, "kitchen") : Promise.resolve(null),
    isOwnerView ? getClosingChecklist(date, "front_desk") : Promise.resolve(null),
    getSales(date),
    getLatestStockSnapshot(),
    countPendingOrders(),
  ]);

  const reorder = orderListFromSnapshot(stockSnapshot);

  return {
    date,
    opening,
    closing,
    openingKitchen,
    openingFrontDesk,
    closingKitchen,
    closingFrontDesk,
    sales,
    salesTotal: sales ? salesTotal(sales) : 0,
    stockSnapshot,
    lowItems: reorder.filter((i) => i.status === "low"),
    outItems: reorder.filter((i) => i.status === "out"),
    pendingOrders,
  };
}
