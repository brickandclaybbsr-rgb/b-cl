"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import {
  createStaff,
  addStockItem,
  addVendor,
  addChecklistItem,
  saveOwnerWhatsApp,
  type ActionState,
} from "@/app/(app)/settings/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";

/** Wraps useFormState + toast + reset-on-success for the small add forms. */
function useAddForm(
  action: (p: ActionState, fd: FormData) => Promise<ActionState>,
  successMsg: string,
) {
  const [state, formAction] = useFormState<ActionState, FormData>(action, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.ok) {
      toast.success(state.message ?? successMsg);
      ref.current?.reset();
    }
  }, [state, successMsg]);
  return { formAction, ref };
}

export function AddStaffForm() {
  const { formAction, ref } = useAddForm(createStaff, "Staff added");
  return (
    <form ref={ref} action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="s-name">Name</Label>
          <Input id="s-name" name="name" placeholder="Ravi Kumar" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-email">Email</Label>
          <Input id="s-email" name="email" type="email" placeholder="ravi@brickandclay.in" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-pass">Temp password</Label>
          <Input id="s-pass" name="password" type="text" placeholder="min 6 chars" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-role">Role</Label>
          <Select id="s-role" name="role" defaultValue="staff">
            <option value="staff">Staff</option>
            <option value="owner">Owner</option>
          </Select>
        </div>
      </div>
      <SubmitButton size="sm" pendingText="Adding…">
        <Plus className="size-4" /> Add staff
      </SubmitButton>
    </form>
  );
}

export function AddStockItemForm() {
  const { formAction, ref } = useAddForm(addStockItem, "Item added");
  return (
    <form ref={ref} action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="flex-1 space-y-1.5" style={{ minWidth: 160 }}>
        <Label htmlFor="i-name">Item name</Label>
        <Input id="i-name" name="name" placeholder="Mozzarella Cheese" required />
      </div>
      <div className="flex-1 space-y-1.5" style={{ minWidth: 120 }}>
        <Label htmlFor="i-cat">Category</Label>
        <Input id="i-cat" name="category" placeholder="Dairy" />
      </div>
      <SubmitButton size="default" pendingText="Adding…">
        <Plus className="size-4" /> Add
      </SubmitButton>
    </form>
  );
}

export function AddVendorForm() {
  const { formAction, ref } = useAddForm(addVendor, "Vendor added");
  return (
    <form ref={ref} action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="v-name">Vendor name</Label>
          <Input id="v-name" name="name" placeholder="Sharma Dairy" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="v-contact">Contact number</Label>
          <Input id="v-contact" name="contact" placeholder="98765 43210" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="v-cat">Supplies</Label>
          <Input id="v-cat" name="supply_category" placeholder="Cheese, Paneer" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="v-days">Order days</Label>
          <Input id="v-days" name="order_days" placeholder="Mon, Wed, Fri" />
        </div>
      </div>
      <SubmitButton size="sm" pendingText="Adding…">
        <Plus className="size-4" /> Add vendor
      </SubmitButton>
    </form>
  );
}

export function AddChecklistItemForm({ type }: { type: "opening" | "closing" }) {
  const { formAction, ref } = useAddForm(addChecklistItem, "Checklist item added");
  return (
    <form ref={ref} action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="type" value={type} />
      <div className="space-y-1.5" style={{ minWidth: 140 }}>
        <Label htmlFor={`c-sec-${type}`}>Section</Label>
        <Input id={`c-sec-${type}`} name="section" placeholder="Kitchen" required />
      </div>
      <div className="flex-1 space-y-1.5" style={{ minWidth: 180 }}>
        <Label htmlFor={`c-lab-${type}`}>Item</Label>
        <Input id={`c-lab-${type}`} name="label" placeholder="Check gas cylinders" required />
      </div>
      <SubmitButton size="default" pendingText="Adding…">
        <Plus className="size-4" /> Add
      </SubmitButton>
    </form>
  );
}

export function WhatsAppForm({ current }: { current: string }) {
  const { formAction, ref } = useAddForm(saveOwnerWhatsApp, "Saved");
  return (
    <form ref={ref} action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="flex-1 space-y-1.5" style={{ minWidth: 200 }}>
        <Label htmlFor="wa">Owner WhatsApp number</Label>
        <Input
          id="wa"
          name="owner_whatsapp_number"
          inputMode="numeric"
          defaultValue={current}
          placeholder="919876543210 (country code, no +)"
          className="font-mono"
        />
      </div>
      <SubmitButton size="default" pendingText="Saving…">
        Save number
      </SubmitButton>
    </form>
  );
}
