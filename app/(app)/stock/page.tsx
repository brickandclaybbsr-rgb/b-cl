import { Package } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { formatDateLabel, todayIST } from "@/lib/date";
import {
  getStockItems,
  getLatestStockSnapshot,
  statusMap,
} from "@/lib/data/stock";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StockForm } from "./stock-form";

export const metadata = { title: "Stock" };

export default async function StockPage() {
  await requireProfile();
  const [items, latest] = await Promise.all([
    getStockItems(),
    getLatestStockSnapshot(),
  ]);

  return (
    <div>
      <PageHeader
        title="Stock Status"
        subtitle={formatDateLabel(todayIST())}
      />
      {items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No stock items yet"
          description="The owner needs to add stock items in Settings before you can track them."
        />
      ) : (
        <StockForm items={items} initial={statusMap(latest)} />
      )}
    </div>
  );
}
