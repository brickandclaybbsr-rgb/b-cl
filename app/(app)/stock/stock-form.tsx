"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useFormState } from "react-dom";
import { toast } from "sonner";
import { ShoppingCart, Search, Plus, Package } from "lucide-react";
import { submitStock, addStockItemInline, type StockFormState } from "./actions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { EmptyState } from "@/components/empty-state";
import { STOCK_STATUS_META, type StockStatus } from "@/lib/constants";
import { formatDateLabel } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { StockItem, StockLine } from "@/lib/database.types";

type ItemState = {
  status: StockStatus;
  current_qty: string;
  current_unit: string;
  qty_required: string;
  qty_required_unit: string;
  needed_by_date: string;
  needed_by_time: string;
  note: string;
};

const STATUSES: StockStatus[] = ["available", "low", "out"];

const UNITS = [
  "kg",
  "gm",
  "litre",
  "ml",
  "box",
  "pouch",
  "packet",
  "can",
  "bottle",
  "piece",
  "crate",
  "sack",
  "tin",
  "bag",
  "bundle"
];

export function StockForm({
  items,
  initial,
}: {
  items: StockItem[];
  initial: Record<string, StockLine>;
}) {
  const [state, formAction] = useFormState<StockFormState, FormData>(
    submitStock,
    {},
  );

  const [values, setValues] = useState<Record<string, ItemState>>(() => {
    const v: Record<string, ItemState> = {};
    for (const item of items) {
      const prev = initial[item.id];
      v[item.id] = {
        status: (prev?.status as StockStatus) ?? "available",
        current_qty: prev?.current_qty !== undefined ? String(prev.current_qty) : "",
        current_unit: prev?.current_unit ?? "kg",
        qty_required: prev?.qty_required !== undefined ? String(prev.qty_required) : "",
        qty_required_unit: prev?.qty_required_unit ?? "kg",
        needed_by_date: prev?.needed_by_date ?? "",
        needed_by_time: prev?.needed_by_time ?? "",
        note: prev?.note ?? "",
      };
    }
    return v;
  });

  // Keep state in sync if items list updates (like when adding an item inline)
  useEffect(() => {
    setValues((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const item of items) {
        if (!next[item.id]) {
          next[item.id] = {
            status: "available",
            current_qty: "",
            current_unit: "kg",
            qty_required: "",
            qty_required_unit: "kg",
            needed_by_date: "",
            needed_by_time: "",
            note: "",
          };
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [items]);

  const [search, setSearch] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("");
  const [isAdding, startAdding] = useTransition();

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.ok) toast.success("Stock status saved ✓");
  }, [state]);

  // Unique categories for the dropdown select
  const categories = useMemo(() => {
    const cats = new Set<string>();
    items.forEach((i) => {
      if (i.category) cats.add(i.category);
    });
    return Array.from(cats).sort();
  }, [items]);

  // Inline Quick-Add
  async function handleAddInline(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemName.trim()) return;
    startAdding(async () => {
      const res = await addStockItemInline(newItemName, newItemCategory);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(`"${newItemName}" added successfully ✓`);
        setNewItemName("");
        setNewItemCategory("");
      }
    });
  }

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.category ?? "").toLowerCase().includes(search.toLowerCase()),
    );
  }, [items, search]);

  const grouped = useMemo(() => {
    const out: { category: string; items: StockItem[] }[] = [];
    for (const item of filteredItems) {
      const cat = item.category ?? "Other";
      let bucket = out.find((b) => b.category === cat);
      if (!bucket) {
        bucket = { category: cat, items: [] };
        out.push(bucket);
      }
      bucket.items.push(item);
    }
    return out.sort((a, b) => a.category.localeCompare(b.category));
  }, [filteredItems]);

  const orderList = items.filter(
    (i) => values[i.id]?.status === "low" || values[i.id]?.status === "out",
  );

  const availableCount = items.filter((i) => values[i.id]?.status === "available").length;

  function setStatus(id: string, status: StockStatus) {
    setValues((v) => ({ ...v, [id]: { ...v[id], status } }));
  }
  function setCurrentQty(id: string, current_qty: string) {
    setValues((v) => ({ ...v, [id]: { ...v[id], current_qty } }));
  }
  function setCurrentUnit(id: string, current_unit: string) {
    setValues((v) => ({ ...v, [id]: { ...v[id], current_unit } }));
  }
  function setQtyRequired(id: string, qty_required: string) {
    setValues((v) => ({ ...v, [id]: { ...v[id], qty_required } }));
  }
  function setQtyRequiredUnit(id: string, qty_required_unit: string) {
    setValues((v) => ({ ...v, [id]: { ...v[id], qty_required_unit } }));
  }
  function setNeededByDate(id: string, needed_by_date: string) {
    setValues((v) => ({ ...v, [id]: { ...v[id], needed_by_date } }));
  }
  function setNeededByTime(id: string, needed_by_time: string) {
    setValues((v) => ({ ...v, [id]: { ...v[id], needed_by_time } }));
  }
  function setNote(id: string, note: string) {
    setValues((v) => ({ ...v, [id]: { ...v[id], note } }));
  }

  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar: Search + Quick Add Inline */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Search Input */}
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-content-secondary" />
          <Input
            placeholder="Search stock items by name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 text-sm bg-bg-card border-border"
          />
        </div>

        {/* Quick Add Card */}
        <Card className="p-2 border-dashed border-warm/40 bg-warm/5 flex items-center justify-between">
          <form onSubmit={handleAddInline} className="flex w-full gap-2 items-center">
            <Input
              placeholder="+ Add item name inline"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="h-8 text-xs font-normal flex-1"
              required
            />
            <select
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value)}
              className="h-8 text-xs bg-bg-elevated border border-border rounded-lg px-2 max-w-[110px]"
            >
              <option value="">Category…</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value="Other">Other</option>
            </select>
            <Button
              type="submit"
              size="sm"
              disabled={isAdding}
              className="h-8 px-3 bg-warm text-black hover:bg-warm/80 font-bold shrink-0 text-xs"
            >
              Add
            </Button>
          </form>
        </Card>
      </div>

      {/* 2. Stock Metrics Overview */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3 text-center bg-success/5 border-success/20">
          <p className="text-[10px] uppercase font-bold text-success/80">Available</p>
          <p className="text-lg font-bold text-success mt-0.5">{availableCount}</p>
        </Card>
        <Card className="p-3 text-center bg-warning/5 border-warning/20">
          <p className="text-[10px] uppercase font-bold text-warning/80">Low Stock</p>
          <p className="text-lg font-bold text-warning mt-0.5">
            {items.filter((i) => values[i.id]?.status === "low").length}
          </p>
        </Card>
        <Card className="p-3 text-center bg-danger/5 border-danger/20">
          <p className="text-[10px] uppercase font-bold text-danger/80">Out of Stock</p>
          <p className="text-lg font-bold text-danger mt-0.5">
            {items.filter((i) => values[i.id]?.status === "out").length}
          </p>
        </Card>
      </div>

      <form action={formAction} className="space-y-4">
        {grouped.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No items found"
            description="No items match your search. Click 'Add' above to create a new one."
            className="py-12"
          />
        ) : (
          grouped.map((group) => (
            <Card key={group.category} className="overflow-hidden">
              <div className="border-b border-border bg-bg-elevated/20 px-4 py-2.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-warm">
                  {group.category}
                </h2>
              </div>
              <div className="divide-y divide-border">
                {group.items.map((item) => {
                  const v = values[item.id];
                  if (!v) return null;
                  return (
                    <div key={item.id} className="px-4 py-3 space-y-3">
                      {/* Name + Status buttons */}
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-content-primary">
                          {item.name}
                        </span>
                        <div className="flex gap-1">
                          {STATUSES.map((s) => {
                            const meta = STOCK_STATUS_META[s];
                            const active = v.status === s;
                            return (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setStatus(item.id, s)}
                                className={cn(
                                  "flex size-9 items-center justify-center rounded-lg border text-base transition-all",
                                  active
                                    ? tone(meta.tone)
                                    : "border-border bg-bg-elevated opacity-50 hover:opacity-80",
                                )}
                                aria-label={meta.label}
                                title={meta.label}
                              >
                                {meta.icon}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Quantity available input + Unit dropdown */}
                      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
                        <span className="text-xs text-content-secondary font-medium shrink-0 sm:w-28">
                          Current Stock:
                        </span>
                        <div className="flex gap-2 w-full max-w-xs">
                          <Input
                            type="number"
                            step="any"
                            value={v.current_qty}
                            onChange={(e) => setCurrentQty(item.id, e.target.value)}
                            placeholder="Quantity"
                            className="h-8 text-xs font-normal flex-1 bg-bg-elevated/20"
                          />
                          <select
                            value={v.current_unit}
                            onChange={(e) => setCurrentUnit(item.id, e.target.value)}
                            className="h-8 text-xs bg-bg-elevated border border-border rounded-lg px-2 text-content-primary"
                          >
                            {UNITS.map((unit) => (
                              <option key={unit} value={unit}>
                                {unit}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Additional Fields (visible only if Low / Out) */}
                      {(v.status === "low" || v.status === "out") && (
                        <div className="grid grid-cols-1 gap-2.5 border-t border-border/50 pt-2.5 sm:grid-cols-4">
                          <div>
                            <label className="text-[10px] uppercase tracking-wider text-content-secondary font-bold">
                              Qty required
                            </label>
                            <div className="flex gap-2 mt-1">
                              <Input
                                type="number"
                                step="any"
                                value={v.qty_required}
                                onChange={(e) => setQtyRequired(item.id, e.target.value)}
                                placeholder="Qty"
                                className="h-8 text-xs font-normal flex-1"
                              />
                              <select
                                value={v.qty_required_unit}
                                onChange={(e) => setQtyRequiredUnit(item.id, e.target.value)}
                                className="h-8 text-xs bg-bg-elevated border border-border rounded-lg px-1 text-content-primary"
                              >
                                {UNITS.map((unit) => (
                                  <option key={unit} value={unit}>
                                    {unit}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] uppercase tracking-wider text-content-secondary font-bold">
                              Needed by Date
                            </label>
                            <Input
                              type="date"
                              value={v.needed_by_date}
                              onChange={(e) => setNeededByDate(item.id, e.target.value)}
                              className="mt-1 h-8 text-xs font-normal"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase tracking-wider text-content-secondary font-bold">
                              Needed by Time
                            </label>
                            <Input
                              type="time"
                              value={v.needed_by_time}
                              onChange={(e) => setNeededByTime(item.id, e.target.value)}
                              className="mt-1 h-8 text-xs font-normal"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase tracking-wider text-content-secondary font-bold">
                              Notes / Urgency
                            </label>
                            <Input
                              value={v.note}
                              onChange={(e) => setNote(item.id, e.target.value)}
                              placeholder="e.g. urgent, client order"
                              className="mt-1 h-8 text-xs font-normal"
                            />
                          </div>
                        </div>
                      )}

                      <input type="hidden" name={`status_${item.id}`} value={v.status} />
                      <input
                        type="hidden"
                        name={`current_qty_${item.id}`}
                        value={v.current_qty}
                      />
                      <input
                        type="hidden"
                        name={`current_unit_${item.id}`}
                        value={v.current_unit}
                      />
                      <input
                        type="hidden"
                        name={`qty_required_${item.id}`}
                        value={v.qty_required}
                      />
                      <input
                        type="hidden"
                        name={`qty_required_unit_${item.id}`}
                        value={v.qty_required_unit}
                      />
                      <input
                        type="hidden"
                        name={`needed_by_date_${item.id}`}
                        value={v.needed_by_date}
                      />
                      <input
                        type="hidden"
                        name={`needed_by_time_${item.id}`}
                        value={v.needed_by_time}
                      />
                      <input type="hidden" name={`note_${item.id}`} value={v.note} />
                    </div>
                  );
                })}
              </div>
            </Card>
          ))
        )}

        {/* 3. Auto order list */}
        <Card className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <ShoppingCart className="size-4 text-warm" />
            <h2 className="text-sm font-semibold">Items to order</h2>
            <Badge variant={orderList.length ? "warning" : "default"}>
              {orderList.length}
            </Badge>
          </div>
          {orderList.length === 0 ? (
            <p className="text-sm text-content-secondary">
              Everything in stock. Nothing to reorder.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {orderList.map((i) => {
                const val = values[i.id];
                if (!val) return null;
                return (
                  <li
                    key={i.id}
                    className="flex flex-col gap-1.5 rounded-xl border border-border bg-bg-elevated/40 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <span className="font-semibold text-content-primary">
                        {i.name}
                      </span>
                      {(val.current_qty || val.qty_required || val.needed_by_date) && (
                        <p className="mt-0.5 text-xs text-content-secondary">
                          {val.current_qty && `Current: ${val.current_qty} ${val.current_unit}`}
                          {val.current_qty && val.qty_required && " · "}
                          {val.qty_required && `Required: ${val.qty_required} ${val.qty_required_unit}`}
                          {(val.needed_by_date || val.needed_by_time) && (
                            <>
                              {" · Need by: "}
                              {val.needed_by_date ? formatDateLabel(val.needed_by_date) : ""}
                              {val.needed_by_time && ` at ${val.needed_by_time}`}
                            </>
                          )}
                        </p>
                      )}
                      {val.note && (
                        <p className="mt-0.5 text-xs italic text-content-secondary">
                          "{val.note}"
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={val.status === "out" ? "danger" : "warning"}
                      className="self-start sm:self-auto"
                    >
                      {STOCK_STATUS_META[val.status].label}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <SubmitButton className="w-full" size="lg" pendingText="Saving…">
          Save Stock Snapshot
        </SubmitButton>
      </form>
    </div>
  );
}

function tone(t: "success" | "warning" | "danger") {
  return {
    success: "border-success bg-success/20 text-success",
    warning: "border-warning bg-warning/20 text-warning",
    danger: "border-danger bg-danger/20 text-danger",
  }[t];
}
