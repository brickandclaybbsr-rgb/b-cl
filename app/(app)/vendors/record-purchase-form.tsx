"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { toast } from "sonner";
import { recordPurchase, type PurchaseFormState } from "./purchase-actions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Vendor } from "@/lib/database.types";

export function RecordPurchaseForm({ vendors }: { vendors: Vendor[] }) {
  const [state, formAction] = useFormState<PurchaseFormState, FormData>(
    recordPurchase,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.ok) {
      toast.success("Purchase recorded ✓");
      formRef.current?.reset();
    }
  }, [state]);

  const today = new Date().toISOString().split("T")[0];

  return (
    <Card className="p-4">
      <form ref={formRef} action={formAction} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="vendor_id">Vendor</Label>
            <Select id="vendor_id" name="vendor_id" defaultValue="" required>
              <option value="" disabled>
                Select a vendor…
              </option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                  {v.supply_category ? ` · ${v.supply_category}` : ""}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="purchased_at">Date of Purchase</Label>
            <Input
              type="date"
              id="purchased_at"
              name="purchased_at"
              defaultValue={today}
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="items">Items Purchased</Label>
          <Textarea
            id="items"
            name="items"
            placeholder="e.g. 5kg mozzarella cheese, 2 boxes tissue paper"
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="amount">Total Amount (₹)</Label>
            <Input
              type="number"
              step="0.01"
              id="amount"
              name="amount"
              placeholder="e.g. 1500.50"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bill">Invoice Bill / Receipt File</Label>
            <Input
              type="file"
              id="bill"
              name="bill"
              accept="image/*,application/pdf"
              className="file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-white/[0.08] file:text-white hover:file:bg-white/[0.12]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Input id="notes" name="notes" placeholder="e.g. Paid in cash, delivered by runner" />
        </div>

        <SubmitButton className="w-full" pendingText="Recording…">
          Record Purchase & Bill
        </SubmitButton>
      </form>
    </Card>
  );
}
