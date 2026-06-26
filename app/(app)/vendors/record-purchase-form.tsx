"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useFormState } from "react-dom";
import { toast } from "sonner";
import { Plus, X, Store } from "lucide-react";
import { recordPurchase, addVendorFromPurchase, type PurchaseFormState } from "./purchase-actions";
import { Card } from "@/components/ui/card";
import { Confetti } from "@/components/ui/confetti";
import { Input } from "@/components/ui/input";
import { FileInput } from "@/components/ui/file-input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";
import type { Vendor, StockItem } from "@/lib/database.types";

const UNITS = [
  "kg","gm","litre","ml","box","pouch","packet",
  "can","bottle","piece","crate","sack","tin","bag","bundle",
];

type PurchaseLine = {
  item_id: string;
  item_name: string;
  custom_name: string;
  qty: string;
  unit: string;
};

function emptyLine(): PurchaseLine {
  return { item_id: "", item_name: "", custom_name: "", qty: "", unit: "kg" };
}

export function RecordPurchaseForm({
  vendors,
  stockItems,
}: {
  vendors: Vendor[];
  stockItems: StockItem[];
}) {
  const [state, formAction] = useFormState<PurchaseFormState, FormData>(recordPurchase, {});
  const formRef = useRef<HTMLFormElement>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const [lines, setLines] = useState<PurchaseLine[]>([emptyLine()]);

  // Add-vendor inline state
  const [showAddVendor, setShowAddVendor]       = useState(false);
  const [newVendorName, setNewVendorName]       = useState("");
  const [newVendorContact, setNewVendorContact] = useState("");
  const [isAddingVendor, startAddVendor]        = useTransition();

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.ok) {
      toast.success("Purchase recorded — stock updated ✓");
      setShowConfetti(true);
      formRef.current?.reset();
      setLines([emptyLine()]);
    }
  }, [state]);

  // ── Item line helpers ──
  function updateLine(i: number, patch: Partial<PurchaseLine>) {
    setLines(prev => {
      const next = [...prev];
      next[i] = { ...next[i], ...patch };
      return next;
    });
  }

  function selectStockItem(i: number, id: string) {
    const s = stockItems.find(x => x.id === id);
    updateLine(i, {
      item_id:   id,
      item_name: s?.name ?? "",
      unit:      s?.min_unit ?? "kg",
    });
  }

  function removeLine(i: number) {
    setLines(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev);
  }

  // ── Vendor add ──
  async function handleAddVendor() {
    startAddVendor(async () => {
      const res = await addVendorFromPurchase(newVendorName, newVendorContact);
      if (res?.error) toast.error(res.error);
      else {
        toast.success(`"${newVendorName}" added as vendor ✓`);
        setShowAddVendor(false);
        setNewVendorName("");
        setNewVendorContact("");
      }
    });
  }

  const today = new Date().toISOString().split("T")[0];
  const stockItemMap = Object.fromEntries(stockItems.map(s => [s.id, s]));

  return (
    <>
      <Confetti active={showConfetti} />

      <Card className="p-4 space-y-5">
        <div>
          <h2 className="text-sm font-bold text-content-primary">Record Purchase / Bill</h2>
          <p className="text-xs text-content-secondary mt-0.5">
            Stock quantities will be auto-updated for selected items.
          </p>
        </div>

        <form ref={formRef} action={formAction} className="space-y-5">

          {/* ── Vendor + Date ── */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="vendor_id">Vendor *</Label>
              <div className="flex gap-2">
                <Select id="vendor_id" name="vendor_id" defaultValue="" required className="flex-1">
                  <option value="" disabled>Select vendor…</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name}{v.supply_category ? ` · ${v.supply_category}` : ""}
                    </option>
                  ))}
                </Select>
                <Button
                  type="button" variant="secondary" size="sm"
                  onClick={() => setShowAddVendor(p => !p)}
                  className="shrink-0 px-3 text-xs"
                >
                  {showAddVendor ? "Cancel" : "+ New"}
                </Button>
              </div>

              {showAddVendor && (
                <div className="rounded-xl border border-border bg-bg-elevated/50 p-3 space-y-2 animate-fade-in">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-content-secondary">Add New Vendor</p>
                  <Input
                    placeholder="Vendor name *"
                    value={newVendorName}
                    onChange={e => setNewVendorName(e.target.value)}
                    className="h-9 text-sm"
                  />
                  <Input
                    placeholder="Phone / contact (optional)"
                    value={newVendorContact}
                    onChange={e => setNewVendorContact(e.target.value)}
                    className="h-9 text-sm"
                  />
                  <Button
                    type="button" size="sm"
                    disabled={isAddingVendor || !newVendorName.trim()}
                    onClick={handleAddVendor}
                    className="w-full h-9 text-xs"
                  >
                    {isAddingVendor ? "Saving…" : "Save Vendor"}
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="purchased_at">Purchase Date *</Label>
              <Input type="date" id="purchased_at" name="purchased_at" defaultValue={today} required />
            </div>
          </div>

          {/* ── Structured item lines ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                Items Purchased *{" "}
                <span className="font-normal text-content-secondary text-[11px]">
                  — stock auto-updates for matched items
                </span>
              </Label>
            </div>

            <div className="space-y-2">
              {lines.map((line, i) => {
                const matched = line.item_id ? stockItemMap[line.item_id] : null;
                return (
                  <div key={i} className="rounded-xl border border-border bg-bg-elevated/30 p-3 space-y-2">
                    {/* Stock item select */}
                    <div className="flex gap-2 items-center">
                      <select
                        value={line.item_id}
                        onChange={e => selectStockItem(i, e.target.value)}
                        className="h-10 flex-1 min-w-0 rounded-xl border border-border bg-bg-elevated px-3 text-sm text-content-primary"
                      >
                        <option value="">Custom / unlisted item…</option>
                        {stockItems.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name}{s.category ? ` (${s.category})` : ""}
                          </option>
                        ))}
                      </select>
                      {lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLine(i)}
                          className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-bg-elevated text-content-secondary hover:text-danger transition-colors"
                        >
                          <X className="size-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Custom name (shown only when no stock item selected) */}
                    {!line.item_id && (
                      <Input
                        placeholder="Item name (e.g. Tissue paper, Ice cubes)"
                        value={line.custom_name}
                        onChange={e => updateLine(i, { custom_name: e.target.value })}
                        className="h-9 text-sm"
                      />
                    )}

                    {/* Qty + unit row */}
                    <div className="flex gap-2 items-center">
                      <div className="flex-1">
                        <Input
                          type="number" min="0" step="any"
                          placeholder="Quantity purchased"
                          value={line.qty}
                          onChange={e => updateLine(i, { qty: e.target.value })}
                          className="h-9 text-sm"
                        />
                      </div>
                      <select
                        value={line.unit}
                        onChange={e => updateLine(i, { unit: e.target.value })}
                        className="h-9 rounded-xl border border-border bg-bg-elevated px-3 text-sm text-content-primary"
                      >
                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>

                    {/* Current stock reference badge */}
                    {matched && (
                      <p className="text-[11px] text-success">
                        ✓ Matches stock item — quantity will be added to current stock
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <Button
              type="button" variant="secondary" size="sm"
              onClick={() => setLines(p => [...p, emptyLine()])}
              className="w-full border-dashed text-xs"
            >
              <Plus className="size-3.5 mr-1" />
              Add Another Item
            </Button>

            {/* Pass structured lines as JSON */}
            <input type="hidden" name="structured_items" value={JSON.stringify(lines)} />
          </div>

          {/* ── Amount + Bill ── */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Total Amount (₹) *</Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-content-secondary font-semibold">₹</span>
                <Input
                  type="number" step="0.01" min="0"
                  id="amount" name="amount"
                  placeholder="0.00"
                  required
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bill">Invoice / Receipt (optional)</Label>
              <FileInput id="bill" name="bill" accept="image/*,application/pdf" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input id="notes" name="notes" placeholder="e.g. Paid in cash, runner delivered" />
          </div>

          <SubmitButton className="w-full" pendingText="Recording & updating stock…">
            Record Purchase & Update Stock
          </SubmitButton>
        </form>
      </Card>
    </>
  );
}
