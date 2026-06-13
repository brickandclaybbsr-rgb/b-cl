"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Clock, PackageCheck, Truck, Zap } from "lucide-react";
import { setOrderStatus } from "./actions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTimestampIST } from "@/lib/date";
import type { OrderStatus } from "@/lib/database.types";
import type { VendorOrderView } from "@/lib/data/vendors";

const STATUS_META: Record<
  OrderStatus,
  { label: string; variant: "warning" | "fire" | "success"; icon: typeof Clock }
> = {
  pending:  { label: "Purchase Requested", variant: "warning", icon: Clock },
  placed:   { label: "Sent to Vendor",     variant: "fire",    icon: Truck },
  received: { label: "Delivered",          variant: "success", icon: PackageCheck },
};

export function OrderCard({
  order,
  isOwner,
}: {
  order: VendorOrderView;
  isOwner: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const meta = STATUS_META[order.status];
  const StatusIcon = meta.icon;

  function update(status: OrderStatus) {
    startTransition(async () => {
      const res = await setOrderStatus(order.id, status);
      if (res?.error) toast.error(res.error);
      else toast.success(`Marked ${status}`);
    });
  }

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold">{order.vendor_name}</h3>
            {order.urgency === "urgent" && (
              <Badge variant="danger">
                <Zap className="size-3" /> Urgent
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-content-secondary">
            {order.raised_by_name} · {formatTimestampIST(order.raised_at)}
          </p>
        </div>
        <Badge variant={meta.variant}>
          <StatusIcon className="size-3" />
          {meta.label}
        </Badge>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm text-content-primary">
        {order.items}
      </p>
      {order.notes && (
        <p className="mt-1 text-xs text-content-secondary">Note: {order.notes}</p>
      )}

      {order.status !== "received" && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
          {order.status === "pending" && isOwner && (
            <Button
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() => update("placed")}
            >
              <Truck className="size-3.5" /> Sent to Vendor
            </Button>
          )}
          {isOwner && (
            <Button
              size="sm"
              variant="success"
              disabled={pending}
              onClick={() => update("received")}
            >
              <PackageCheck className="size-3.5" /> Mark Delivered
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
