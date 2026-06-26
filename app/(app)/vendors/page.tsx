import { ShoppingCart, Store, Receipt, FileText, Download, Package } from "lucide-react";
import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { getVendors, getAllVendors, getOrders } from "@/lib/data/vendors";
import { getPurchases } from "@/lib/data/purchases";
import { getStockItems } from "@/lib/data/stock";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RaiseOrderForm } from "./raise-order-form";
import { OrderCard } from "./order-card";
import { RecordPurchaseForm } from "./record-purchase-form";
import { VendorManageClient } from "./vendor-manage-client";
import { formatDateLabel } from "@/lib/date";
import { cn } from "@/lib/utils";

export const metadata = { title: "Vendor & Bills" };

interface Props {
  searchParams: { tab?: string };
}

export default async function VendorsPage({ searchParams }: Props) {
  const profile = await requireProfile();
  const isOwner = profile.role === "owner";
  const isInventoryManager = profile.role === "inventory_manager";

  const currentTab = searchParams.tab ?? "orders";

  const [vendors, allVendors, orders, purchases, stockItems] = await Promise.all([
    getVendors(),
    isOwner ? getAllVendors() : Promise.resolve([]),
    getOrders(),
    getPurchases(),
    getStockItems(),
  ]);

  const activeOrders  = orders.filter(o => o.status !== "received");
  const recentOrders  = orders.filter(o => o.status === "received").slice(0, 10);

  return (
    <div>
      <PageHeader
        title={isOwner ? "Vendor & Purchases" : "Orders & Bills"}
        subtitle={
          isOwner
            ? "Manage vendors, track orders, and audit purchase bills"
            : "Raise order requests and log purchase invoices"
        }
      />

      {/* Top Stock ↔ Vendors strip — hidden for inventory manager (bottom nav handles it) */}
      {!isInventoryManager && (
        <div className="mb-4 flex gap-1 border-b border-border pb-px">
          <Link
            href="/stock"
            className="flex items-center gap-1.5 pb-3 px-3 text-sm font-semibold text-content-secondary hover:text-content-primary transition-colors"
          >
            <Package className="size-4" /> Stock
          </Link>
          <Link
            href="/vendors"
            className="relative flex items-center gap-1.5 pb-3 text-sm font-semibold text-white after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-white"
          >
            <ShoppingCart className="size-4" /> {isOwner ? "Vendors" : "Orders"}
          </Link>
        </div>
      )}

      {/* Inner sub-tabs — hidden for inventory manager (they navigate via bottom nav already) */}
      {!isInventoryManager && (
        <div className="mb-6 flex gap-4 border-b border-border pb-px">
          <Link
            href="/vendors?tab=orders"
            className={cn(
              "relative pb-3 text-sm font-semibold transition-all duration-200",
              currentTab === "orders"
                ? "text-white after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-white"
                : "text-content-secondary hover:text-content-primary",
            )}
          >
            <span className="flex items-center gap-1.5">
              <ShoppingCart className="size-4" />
              Order Requests
            </span>
          </Link>
          <Link
            href="/vendors?tab=purchases"
            className={cn(
              "relative pb-3 text-sm font-semibold transition-all duration-200",
              currentTab === "purchases"
                ? "text-white after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-white"
                : "text-content-secondary hover:text-content-primary",
            )}
          >
            <span className="flex items-center gap-1.5">
              <Receipt className="size-4" />
              Purchases & Bills
            </span>
          </Link>
          {isOwner && (
            <Link
              href="/vendors?tab=manage"
              className={cn(
                "relative pb-3 text-sm font-semibold transition-all duration-200",
                currentTab === "manage"
                  ? "text-white after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-white"
                  : "text-content-secondary hover:text-content-primary",
              )}
            >
              <span className="flex items-center gap-1.5">
                <Store className="size-4" />
                Vendors
              </span>
            </Link>
          )}
        </div>
      )}

      {/* ── Tab content ── */}

      {currentTab === "orders" ? (
        /* Orders tab */
        <div className="space-y-6">
          {vendors.length === 0 ? (
            <EmptyState
              icon={Store}
              title="No vendors configured"
              description={
                isOwner
                  ? "Add your suppliers in the Vendors tab to start raising orders."
                  : "The owner needs to add vendors before you can raise orders."
              }
            >
              {isOwner && (
                <Button asChild size="sm">
                  <Link href="/vendors?tab=manage">Manage Vendors</Link>
                </Button>
              )}
            </EmptyState>
          ) : (
            <RaiseOrderForm vendors={vendors} />
          )}

          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-content-secondary">
              <ShoppingCart className="size-4" />
              {isOwner ? "Open orders" : "Your open orders"}
            </h2>
            {activeOrders.length === 0 ? (
              <EmptyState
                icon={ShoppingCart}
                title="No open orders"
                description="New order requests will show up here."
              />
            ) : (
              activeOrders.map(o => <OrderCard key={o.id} order={o} isOwner={isOwner} />)
            )}
          </section>

          {recentOrders.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-content-secondary">
                Recently received
              </h2>
              {recentOrders.map(o => <OrderCard key={o.id} order={o} isOwner={isOwner} />)}
            </section>
          )}
        </div>

      ) : currentTab === "manage" && isOwner ? (
        /* Vendor management (owner only) */
        <VendorManageClient vendors={allVendors} />

      ) : (
        /* Purchases & Bills tab */
        <div className="space-y-6">
          <RecordPurchaseForm vendors={vendors} stockItems={stockItems} />

          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-content-secondary">
              <FileText className="size-4" />
              Purchase & Bill Logs
            </h2>
            {purchases.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="No purchases recorded yet"
                description="Fill in the form above to log your first purchase."
              />
            ) : (
              <div className="space-y-3">
                {purchases.map(p => (
                  <Card key={p.id} className="p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-content-primary">{p.vendor_name}</h3>
                          <span className="text-sm font-bold text-success">
                            ₹{p.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-content-secondary">
                          {p.submitted_by_name} · {formatDateLabel(p.purchased_at)}
                        </p>
                      </div>
                      {p.bill_url && (
                        <Button asChild size="sm" variant="secondary" className="self-start gap-1">
                          <Link href={p.bill_url} target="_blank">
                            <Download className="size-3.5" />
                            View Bill
                          </Link>
                        </Button>
                      )}
                    </div>
                    <div className="mt-3 rounded-lg bg-bg-elevated/40 p-3">
                      <p className="whitespace-pre-wrap text-sm text-content-primary">{p.items}</p>
                    </div>
                    {p.notes && (
                      <p className="mt-2 text-xs text-content-secondary italic">Note: {p.notes}</p>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
