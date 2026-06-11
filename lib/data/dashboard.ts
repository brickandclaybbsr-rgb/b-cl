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
  opening: OpeningChecklist | null;
  closing: ClosingChecklist | null;
  sales: DailySales | null;
  salesTotal: number;
  stockSnapshot: StockSnapshot | null;
  lowItems: StockLine[];
  outItems: StockLine[];
  pendingOrders: number;
}

/** Aggregates everything the dashboards need for today's IST business date. */
export async function getTodaySnapshot(): Promise<TodaySnapshot> {
  const date = todayIST();
  const [opening, closing, sales, stockSnapshot, pendingOrders] =
    await Promise.all([
      getOpeningChecklist(date),
      getClosingChecklist(date),
      getSales(date),
      getLatestStockSnapshot(),
      countPendingOrders(),
    ]);

  const reorder = orderListFromSnapshot(stockSnapshot);

  return {
    date,
    opening,
    closing,
    sales,
    salesTotal: sales ? salesTotal(sales) : 0,
    stockSnapshot,
    lowItems: reorder.filter((i) => i.status === "low"),
    outItems: reorder.filter((i) => i.status === "out"),
    pendingOrders,
  };
}
