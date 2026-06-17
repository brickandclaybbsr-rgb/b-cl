"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { toast } from "sonner";
import { raiseOrder, type OrderFormState } from "./actions";
import { Card } from "@/components/ui/card";
import { Confetti } from "@/components/ui/confetti";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Vendor } from "@/lib/database.types";

export function RaiseOrderForm({ vendors }: { vendors: Vendor[] }) {
  const [state, formAction] = useFormState<OrderFormState, FormData>(
    raiseOrder,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.ok) {
      toast.success("Order request raised ✓");
      setShowConfetti(true);
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <>
    <Confetti active={showConfetti} />
    <Card className="p-4">
      <div className="mb-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-warm">
          Raise Purchase Request
        </h2>
        <p className="mt-1 text-xs text-content-secondary">
          Procurement will coordinate with the vendor on WhatsApp and update the status below.
        </p>
      </div>
      <form ref={formRef} action={formAction} className="space-y-4">
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
          <Label htmlFor="items">Items needed</Label>
          <Textarea
            id="items"
            name="items"
            placeholder="e.g. 5kg mozzarella, 2 boxes dough"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="urgency">Urgency</Label>
          <Select id="urgency" name="urgency" defaultValue="normal">
            <option value="normal">Normal</option>
            <option value="urgent">Urgent</option>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Input id="notes" name="notes" placeholder="Any extra detail" />
        </div>

        <SubmitButton className="w-full" pendingText="Raising…">
          Raise order request
        </SubmitButton>
      </form>
    </Card>
    </>
  );
}
