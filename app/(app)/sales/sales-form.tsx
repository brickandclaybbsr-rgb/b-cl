"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { toast } from "sonner";
import { Banknote, CreditCard, Smartphone, ShoppingBag, AlertTriangle } from "lucide-react";
import { submitSales, updateSales, type SalesFormState } from "./actions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";
import { Confetti } from "@/components/ui/confetti";
import { formatINR } from "@/lib/utils";
import type { DailySales } from "@/lib/database.types";

export function SalesForm({
  date,
  editMode,
  initialValues,
}: {
  date?: string;
  editMode?: boolean;
  initialValues?: DailySales;
}) {
  const action = editMode ? updateSales : submitSales;
  const [state, formAction] = useFormState<SalesFormState, FormData>(action, {});
  const [showConfetti, setShowConfetti] = useState(false);
  const [showZeroWarning, setShowZeroWarning] = useState(false);
  const [zeroReason, setZeroReason] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const iv = initialValues;
  const [openingCash, setOpeningCash]         = useState(iv ? String(iv.opening_cash) : "");
  const [cash, setCash]                       = useState(iv ? String(iv.cash_sales) : "");
  const [card, setCard]                       = useState(iv ? String(iv.card_sales) : "");
  const [upi, setUpi]                         = useState(iv ? String(iv.upi_sales) : "");
  const [zomatoGold, setZomatoGold]           = useState(iv ? String(iv.zomato_gold_sales) : "");
  const [zomato, setZomato]                   = useState(iv ? String(iv.zomato_sales) : "");
  const [swiggy, setSwiggy]                   = useState(iv ? String(iv.swiggy_sales) : "");
  const [swiggyDineout, setSwiggyDineout]     = useState(iv ? String(iv.swiggy_dineout_sales) : "");
  const [eazyDiner, setEazyDiner]             = useState(iv ? String(iv.eazy_diner_sales) : "");
  const [closingBalance, setClosingBalance]   = useState(iv ? String(iv.closing_balance) : "");

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.ok) {
      toast.success(editMode ? "Sales updated ✓" : "Sales saved ✓");
      setShowConfetti(true);
    }
  }, [state, editMode]);

  const totalSale =
    num(cash) + num(card) + num(upi) +
    num(zomatoGold) + num(zomato) + num(swiggy) + num(swiggyDineout) + num(eazyDiner);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (num(closingBalance) === 0 && !showZeroWarning) {
      e.preventDefault();
      setShowZeroWarning(true);
    }
  }

  function confirmZeroAndSubmit() {
    if (!zeroReason.trim()) {
      toast.error("Please explain why the closing balance is ₹0");
      return;
    }
    setShowZeroWarning(false);
    // Append reason to notes by injecting a hidden field, then submit
    const form = formRef.current;
    if (!form) return;
    const hidden = document.createElement("input");
    hidden.type = "hidden";
    hidden.name = "_zero_closing_reason";
    hidden.value = zeroReason.trim();
    form.appendChild(hidden);
    form.requestSubmit();
  }

  return (
    <>
    <Confetti active={showConfetti} />
    <form ref={formRef} action={formAction} onSubmit={handleSubmit} className="space-y-4">
      {date && <input type="hidden" name="_date" value={date} />}

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
          onChange={(v) => { setClosingBalance(v); if (num(v) > 0) setShowZeroWarning(false); }}
        />
      </Card>

      {/* Zero closing balance warning */}
      {showZeroWarning && (
        <div className="rounded-xl border-2 border-warning/50 bg-warning/10 p-4 space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="size-5 shrink-0 text-warning mt-0.5" />
            <div>
              <p className="text-sm font-bold text-warning">Closing balance is ₹0 — how?</p>
              <p className="text-xs text-content-secondary mt-0.5">
                This is unusual. Please explain before submitting.
              </p>
            </div>
          </div>
          <Textarea
            placeholder="e.g. All cash withdrawn by owner, no cash sales today…"
            value={zeroReason}
            onChange={(e) => setZeroReason(e.target.value)}
            className="text-sm"
            rows={2}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowZeroWarning(false)}
              className="flex-1 rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm font-semibold text-content-secondary"
            >
              Go back & fix
            </button>
            <button
              type="button"
              onClick={confirmZeroAndSubmit}
              className="flex-1 rounded-lg bg-warning px-3 py-2 text-sm font-bold text-black"
            >
              Confirm & submit
            </button>
          </div>
        </div>
      )}

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
        <Textarea
          id="notes"
          name="notes"
          placeholder="Any context on today's sales"
          defaultValue={iv?.notes ?? ""}
        />
      </Card>

      <SubmitButton className="w-full" size="lg" pendingText={editMode ? "Updating…" : "Saving…"}>
        {editMode ? "Update Sales" : "Save Daily Sales"}
      </SubmitButton>
      {!editMode && (
        <p className="pb-2 text-center text-xs text-content-secondary">
          One sales entry per day. This can&apos;t be edited after saving.
        </p>
      )}
    </form>
    </>
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
