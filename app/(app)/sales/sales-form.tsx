"use client";

import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { toast } from "sonner";
import { Banknote, CreditCard, Smartphone, ShoppingBag } from "lucide-react";
import { submitSales, type SalesFormState } from "./actions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatINR } from "@/lib/utils";

export function SalesForm() {
  const [state, formAction] = useFormState<SalesFormState, FormData>(submitSales, {});

  const [openingCash, setOpeningCash]         = useState("");
  const [cash, setCash]                       = useState("");
  const [card, setCard]                       = useState("");
  const [upi, setUpi]                         = useState("");
  const [zomatoGold, setZomatoGold]           = useState("");
  const [zomato, setZomato]                   = useState("");
  const [swiggy, setSwiggy]                   = useState("");
  const [swiggyDineout, setSwiggyDineout]     = useState("");
  const [eazyDiner, setEazyDiner]             = useState("");
  const [closingBalance, setClosingBalance]   = useState("");

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.ok) toast.success("Sales saved ✓");
  }, [state]);

  const totalSale =
    num(cash) + num(card) + num(upi) +
    num(zomatoGold) + num(zomato) + num(swiggy) + num(swiggyDineout) + num(eazyDiner);

  return (
    <form action={formAction} className="space-y-4">

      {/* Opening Cash */}
      <Card className="space-y-3 p-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-warm">Opening</h2>
        <MoneyField
          icon={<Banknote className="size-4" />}
          label="Opening Cash"
          name="opening_cash"
          value={openingCash}
          onChange={setOpeningCash}
        />
      </Card>

      {/* Direct Sales */}
      <Card className="space-y-3 p-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-warm">Direct Sales</h2>
        <MoneyField
          icon={<Banknote className="size-4" />}
          label="Cash Sale"
          name="cash_sales"
          value={cash}
          onChange={setCash}
        />
        <MoneyField
          icon={<CreditCard className="size-4" />}
          label="Card"
          name="card_sales"
          value={card}
          onChange={setCard}
        />
        <MoneyField
          icon={<Smartphone className="size-4" />}
          label="UPI"
          name="upi_sales"
          value={upi}
          onChange={setUpi}
        />
      </Card>

      {/* Aggregators */}
      <Card className="space-y-3 p-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-warm">
          <ShoppingBag className="inline size-3.5 mr-1" />
          Aggregators
        </h2>
        <MoneyField label="Zomato Gold (Dine In)" name="zomato_gold_sales" value={zomatoGold} onChange={setZomatoGold} />
        <MoneyField label="Zomato" name="zomato_sales" value={zomato} onChange={setZomato} />
        <MoneyField label="Swiggy" name="swiggy_sales" value={swiggy} onChange={setSwiggy} />
        <MoneyField label="Swiggy Dineout" name="swiggy_dineout_sales" value={swiggyDineout} onChange={setSwiggyDineout} />
        <MoneyField label="EazyDiner" name="eazy_diner_sales" value={eazyDiner} onChange={setEazyDiner} />
      </Card>

      {/* Total */}
      <div className="flex items-center justify-between rounded-xl bg-fire/10 px-4 py-3">
        <span className="text-sm font-semibold text-warm">Total Sales</span>
        <span className="font-mono text-xl font-bold tabular-nums text-warm">
          {formatINR(totalSale)}
        </span>
      </div>

      {/* Closing Balance */}
      <Card className="space-y-3 p-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-warm">Closing</h2>
        <MoneyField
          icon={<Banknote className="size-4" />}
          label="Closing Balance (Cash in Drawer)"
          name="closing_balance"
          value={closingBalance}
          onChange={setClosingBalance}
        />
      </Card>

      {/* Discounts / Complimentary */}
      <Card className="space-y-3 p-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-warm">
          Discounts / Complimentary
        </h2>
        <MoneyField label="Discount Given" name="discount_amount" />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="complimentary_count">Complimentary Meals</Label>
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
        Save Daily Sales
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
        {...(onChange ? { value, onChange: (e) => onChange(e.target.value) } : {})}
      />
    </div>
  );
}

function num(v: string) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}
