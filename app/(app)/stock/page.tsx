import { Package, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { formatDateLabel, todayIST } from "@/lib/date";
import {
  getStockItems,
  getLatestStockSnapshot,
  getRecentSnapshots,
  computeConsumptionMap,
  statusMap,
} from "@/lib/data/stock";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StockForm } from "./stock-form";

export const metadata = { title: "Stock" };

export default async function StockPage() {
  const profile = await requireProfile();
  const isOwner = profile.role === "owner";
  const isInventoryManager = profile.role === "inventory_manager";

  const [items, latest, recentSnaps] = await Promise.all([
    getStockItems(),
    getLatestStockSnapshot(),
    getRecentSnapshots(7),
  ]);

  const consumptionMap = computeConsumptionMap(recentSnaps);

  return (
    <div>
      <PageHeader
        title="Stock Inventory"
        subtitle={formatDateLabel(todayIST())}
      />

      {!isInventoryManager && (
        <div className="mb-4 flex gap-1 border-b border-border pb-px">
          <Link
            href="/stock"
            className="relative flex items-center gap-1.5 pb-3 text-sm font-semibold text-white after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-white"
          >
            <Package className="size-4" /> Stock
          </Link>
          <Link
            href="/vendors"
            className="flex items-center gap-1.5 pb-3 px-3 text-sm font-semibold text-content-secondary hover:text-content-primary transition-colors"
          >
            <ShoppingCart className="size-4" /> {isOwner ? "Vendors" : "Orders"}
          </Link>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No stock items yet"
          description="The owner needs to add stock items in Settings before you can track them."
        />
      ) : (
        <StockForm
          items={items}
          initial={statusMap(latest)}
          lastSnapshot={latest}
          consumptionMap={consumptionMap}
        />
      )}
    </div>
  );
}
