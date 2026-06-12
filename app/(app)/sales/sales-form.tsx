"use client";

import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { toast } from "sonner";
import { Banknote, Smartphone, Bike } from "lucide-react";
import { submitSales, type SalesFormState } from "./actions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatINR } from "@/lib/utils";

export function SalesForm() {
  const [state, formAction] = useFormState<SalesFormState, FormData>(
    submitSales,
    {},
  );
  const [cash, setCash] = useState("");
  const [online, setOnline] = useState("");
  const [agg, setAgg] = useState("");

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.ok) toast.success("Sales saved ✓");
  }, [state]);

  const total = num(cash) + num(online) + num(agg);

  return (
    <form action={formAction} className="space-y-4">
      <Card className="space-y-4 p-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-warm">
          Sales breakdown
        </h2>
        <MoneyField
          icon={<Banknote className="size-4" />}
          label="Cash sales"
          name="cash_sales"
          value={cash}
          onChange={setCash}
        />
        <MoneyField
          icon={<Smartphone className="size-4" />}
          label="Online (UPI / Card)"
          name="online_sales"
          value={online}
          onChange={setOnline}
        />
        <MoneyField
          icon={<Bike className="size-4" />}
          label="Zomato / Swiggy"
          name="aggregator_sales"
          value={agg}
          onChange={setAgg}
        />

        <div className="flex items-center justify-between rounded-xl bg-fire/10 px-4 py-3">
          <span className="text-sm font-semibold text-warm">Total sales</span>
          <span className="font-mono text-xl font-bold tabular-nums text-warm">
            {formatINR(total)}
          </span>
        </div>
      </Card>


      <Card className="space-y-4 p-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-warm">
          Discounts / complimentary
        </h2>
        <MoneyField label="Discount given" name="discount_amount" />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="complimentary_count">Complimentary meals</Label>
            <Input
              id="complimentary_count"
              name="complimentary_count"
              type="number"
              inputMode="numeric"
              min="0"
              placeholder="0"
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="complimentary_value">Worth (₹)</Label>
            <Input
              id="complimentary_value"
              name="complimentary_value"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="0"
              className="font-mono"
            />
          </div>
        </div>
      </Card>

      <Card className="space-y-1.5 p-4">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" placeholder="Any context on today's sales" />
      </Card>

      <SubmitButton className="w-full" size="lg" pendingText="Saving…">
        Save daily sales
      </SubmitButton>
      <p className="pb-2 text-center text-xs text-content-secondary">
        One sales entry per day. This can&apos;t be edited after saving.
      </p>
    </form>
  );
}

function MoneyField({
  icon,
  label,
  name,
  value,
  onChange,
}: {
  icon?: React.ReactNode;
  label: string;
  name: string;
  value?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="flex items-center gap-1.5">
        {icon}
        {label} (₹)
      </Label>
      <Input
        id={name}
        name={name}
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        placeholder="0"
        className="font-mono"
        {...(onChange
          ? { value, onChange: (e) => onChange(e.target.value) }
          : {})}
      />
    </div>
  );
}

function num(v: string) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}
