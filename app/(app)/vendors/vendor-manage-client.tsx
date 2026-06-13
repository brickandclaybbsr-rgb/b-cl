"use client";

import { useState, useEffect } from "react";
import { useFormState } from "react-dom";
import { toast } from "sonner";
import { Plus, Store, ToggleLeft, ToggleRight, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { addVendor, toggleVendor, deleteVendor } from "@/app/(app)/settings/actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Vendor {
  id: string;
  name: string;
  contact: string | null;
  supply_category: string | null;
  order_days: string | null;
  is_active: boolean;
}

interface Props {
  vendors: Vendor[];
}

export function VendorManageClient({ vendors }: Props) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [addState, addAction] = useFormState(addVendor, {});

  useEffect(() => {
    if (addState.error) toast.error(addState.error);
    if (addState.ok) {
      toast.success("Vendor added!");
      setShowAddForm(false);
    }
  }, [addState]);

  const handleToggle = async (id: string, current: boolean) => {
    const res = await toggleVendor(id, !current);
    if (res.error) toast.error(res.error);
    else toast.success(current ? "Vendor deactivated" : "Vendor activated");
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete vendor "${name}"? This cannot be undone.`)) return;
    const res = await deleteVendor(id);
    if (res.error) toast.error(res.error);
    else toast.success("Vendor deleted.");
  };

  const active = vendors.filter((v) => v.is_active);
  const inactive = vendors.filter((v) => !v.is_active);

  return (
    <div className="space-y-5">
      {/* Add vendor */}
      <Card className="overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-white/[0.02]"
        >
          <span className="flex items-center gap-2 text-sm font-bold text-content-primary">
            <Plus className="size-4 text-warm" />
            Add New Vendor
          </span>
          {showAddForm ? (
            <ChevronUp className="size-4 text-content-secondary" />
          ) : (
            <ChevronDown className="size-4 text-content-secondary" />
          )}
        </button>

        {showAddForm && (
          <form action={addAction} className="border-t border-border/40 p-4 space-y-3 animate-fade-in">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label htmlFor="v-name">Vendor Name *</Label>
                <Input id="v-name" name="name" placeholder="e.g. Rajesh Traders" required />
              </div>
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label htmlFor="v-contact">Contact / Phone</Label>
                <Input id="v-contact" name="contact" placeholder="e.g. 9876543210" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="v-category">Supply Category</Label>
                <Input id="v-category" name="supply_category" placeholder="e.g. Vegetables, Dairy" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="v-days">Order Days</Label>
                <Input id="v-days" name="order_days" placeholder="e.g. Mon, Wed, Fri" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <SubmitButton size="sm" pendingText="Adding…">
                <Plus className="size-3.5" /> Add Vendor
              </SubmitButton>
            </div>
          </form>
        )}
      </Card>

      {/* Active vendors */}
      <section className="space-y-3">
        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-content-secondary">
          <Store className="size-4" /> Active Vendors ({active.length})
        </h3>
        {active.length === 0 ? (
          <Card className="p-6 text-center text-xs text-content-secondary">
            No active vendors. Add one above.
          </Card>
        ) : (
          <div className="space-y-2">
            {active.map((v) => (
              <VendorRow key={v.id} vendor={v} onToggle={handleToggle} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </section>

      {/* Inactive vendors */}
      {inactive.length > 0 && (
        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-content-secondary">
            Inactive Vendors ({inactive.length})
          </h3>
          <div className="space-y-2 opacity-60">
            {inactive.map((v) => (
              <VendorRow key={v.id} vendor={v} onToggle={handleToggle} onDelete={handleDelete} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function VendorRow({
  vendor,
  onToggle,
  onDelete,
}: {
  vendor: Vendor;
  onToggle: (id: string, current: boolean) => void;
  onDelete: (id: string, name: string) => void;
}) {
  return (
    <Card className="flex items-center gap-3 p-3.5">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-content-primary truncate">{vendor.name}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-content-secondary">
          {vendor.contact && <span>{vendor.contact}</span>}
          {vendor.supply_category && (
            <Badge variant="default" className="text-[9px] px-1.5 py-0">{vendor.supply_category}</Badge>
          )}
          {vendor.order_days && <span>Orders: {vendor.order_days}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => onToggle(vendor.id, vendor.is_active)}
          className="flex items-center gap-1 text-xs font-semibold transition-colors"
          title={vendor.is_active ? "Deactivate" : "Activate"}
        >
          {vendor.is_active ? (
            <ToggleRight className="size-5 text-success" />
          ) : (
            <ToggleLeft className="size-5 text-content-secondary" />
          )}
        </button>
        <button
          type="button"
          onClick={() => onDelete(vendor.id, vendor.name)}
          className="rounded-lg p-1.5 text-content-secondary hover:bg-danger/10 hover:text-danger transition-colors"
          title="Delete vendor"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </Card>
  );
}
