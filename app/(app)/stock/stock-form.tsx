"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useFormState } from "react-dom";
import { toast } from "sonner";
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Package,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { submitStock, addStockItemInline, type StockFormState } from "./actions";
import { Card } from "@/components/ui/card";
import { Confetti } from "@/components/ui/confetti";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { EmptyState } from "@/components/empty-state";
import { STOCK_STATUS_META, type StockStatus } from "@/lib/constants";
import { formatDateLabel } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { StockItem, StockLine, StockSnapshot } from "@/lib/database.types";

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

type Tab = "all" | "at_risk" | "ok";

const STATUSES: StockStatus[] = ["available", "low", "out"];

const UNITS = [
  "kg", "gm", "litre", "ml", "box", "pouch", "packet",
  "can", "bottle", "piece", "crate", "sack", "tin", "bag", "bundle",
];

function getQtyStep(unit: string): number {
  if (["kg", "litre"].includes(unit)) return 0.5;
  if (["gm", "ml"].includes(unit)) return 100;
  return 1;
}

function statusTone(t: "success" | "warning" | "danger") {
  return {
    success: "border-success bg-success/20 text-success",
    warning: "border-warning bg-warning/20 text-warning",
    danger: "border-danger bg-danger/20 text-danger",
  }[t];
}

export function StockForm({
  items,
  initial,
  lastSnapshot,
}: {
  items: StockItem[];
  initial: Record<string, StockLine>;
  lastSnapshot: StockSnapshot | null;
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
        current_qty:
          prev?.current_qty !== undefined ? String(prev.current_qty) : "",
        current_unit: prev?.current_unit ?? item.min_unit ?? "kg",
        qty_required:
          prev?.qty_required !== undefined ? String(prev.qty_required) : "",
        qty_required_unit: prev?.qty_required_unit ?? item.min_unit ?? "kg",
        needed_by_date: prev?.needed_by_date ?? "",
        needed_by_time: prev?.needed_by_time ?? "",
        note: prev?.note ?? "",
      };
    }
    return v;
  });

  // Sync newly added items into local state
  useEffect(() => {
    setValues((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const item of items) {
        if (!next[item.id]) {
          next[item.id] = {
            status: "available",
            current_qty: "",
            current_unit: item.min_unit ?? "kg",
            qty_required: "",
            qty_required_unit: item.min_unit ?? "kg",
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
  const [showConfetti, setShowConfetti] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.ok) {
      toast.success("Stock inventory saved ✓");
      setShowConfetti(true);
    }
  }, [state]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    items.forEach((i) => {
      if (i.category) cats.add(i.category);
    });
    return Array.from(cats).sort();
  }, [items]);

  // Smart quantity change: auto-detect status
  function handleQtyChange(id: string, qty: string) {
    const item = items.find((i) => i.id === id);
    const qtyNum = parseFloat(qty);
    setValues((v) => {
      let status = v[id]?.status ?? "available";
      if (qty !== "" && !isNaN(qtyNum)) {
        if (qtyNum === 0) {
          status = "out";
        } else if (item?.min_qty != null && qtyNum < item.min_qty) {
          if (status === "available") status = "low";
        } else if (qtyNum > 0 && status === "out") {
          status = "available";
        }
      }
      return { ...v, [id]: { ...v[id], current_qty: qty, status } };
    });
  }

  function adjustQty(id: string, delta: number) {
    const v = values[id];
    if (!v) return;
    const current = parseFloat(v.current_qty) || 0;
    const next = Math.max(0, +(current + delta).toFixed(3));
    handleQtyChange(id, String(next));
  }

  function setStatus(id: string, status: StockStatus) {
    setValues((v) => ({ ...v, [id]: { ...v[id], status } }));
  }

  function updateField(
    id: string,
    field: keyof ItemState,
    value: string,
  ) {
    setValues((v) => ({ ...v, [id]: { ...v[id], [field]: value } }));
  }

  // Tab + search filtering
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.category ?? "").toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;
      const status = values[item.id]?.status ?? "available";
      if (activeTab === "at_risk") return status === "low" || status === "out";
      if (activeTab === "ok") return status === "available";
      return true;
    });
  }, [items, search, values, activeTab]);

  // Per-category status counts (over ALL items, not filtered)
  const categorySummary = useMemo(() => {
    const summary: Record<string, { ok: number; low: number; out: number }> =
      {};
    for (const item of items) {
      const cat = item.category ?? "Other";
      if (!summary[cat]) summary[cat] = { ok: 0, low: 0, out: 0 };
      const status = values[item.id]?.status ?? "available";
      if (status === "available") summary[cat].ok++;
      else if (status === "low") summary[cat].low++;
      else summary[cat].out++;
    }
    return summary;
  }, [items, values]);

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

  const atRiskCount = items.filter((i) => {
    const s = values[i.id]?.status;
    return s === "low" || s === "out";
  }).length;
  const okCount = items.filter(
    (i) => values[i.id]?.status === "available",
  ).length;

  const orderList = items.filter(
    (i) =>
      values[i.id]?.status === "low" || values[i.id]?.status === "out",
  );

  // Total stock value (only when at least one item has price_per_unit)
  const totalValue = useMemo(() => {
    let total = 0;
    let hasAny = false;
    for (const item of items) {
      if (!item.price_per_unit) continue;
      const qty = parseFloat(values[item.id]?.current_qty ?? "");
      if (!isNaN(qty)) {
        total += qty * item.price_per_unit;
        hasAny = true;
      }
    }
    return hasAny ? total : null;
  }, [items, values]);

  async function handleAddInline(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemName.trim()) return;
    startAdding(async () => {
      const res = await addStockItemInline(newItemName, newItemCategory);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(`"${newItemName}" added ✓`);
        setNewItemName("");
        setNewItemCategory("");
      }
    });
  }

  function toggleCategory(cat: string) {
    setCollapsedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <Confetti active={showConfetti} />

      {/* Last updated */}
      {lastSnapshot && (
        <div className="flex items-center gap-2 text-xs text-content-secondary">
          <Clock className="size-3.5 shrink-0" />
          <span>
            Last updated {formatDateLabel(lastSnapshot.date)}
            {lastSnapshot.submitted_at && (
              <>
                {" at "}
                {new Date(lastSnapshot.submitted_at).toLocaleTimeString(
                  "en-IN",
                  { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" },
                )}
              </>
            )}
          </span>
        </div>
      )}

      {/* Search + Quick Add */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-content-secondary" />
          <Input
            placeholder="Search items by name or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 text-sm bg-bg-card border-border"
          />
        </div>
        <Card className="p-2 border-dashed border-warm/40 bg-warm/5 flex items-center">
          <form
            onSubmit={handleAddInline}
            className="flex w-full gap-2 items-center"
          >
            <Input
              placeholder="+ Quick add item…"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="h-8 text-xs font-normal flex-1"
              required
            />
            <select
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value)}
              className="h-8 text-xs bg-bg-elevated border border-border rounded-lg px-2 max-w-[100px]"
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

      {/* Metrics row */}
      <div
        className={cn(
          "grid gap-2",
          totalValue !== null ? "grid-cols-4" : "grid-cols-3",
        )}
      >
        <Card className="p-3 text-center bg-success/5 border-success/20">
          <p className="text-[10px] uppercase font-bold text-success/80">
            Available
          </p>
          <p className="text-xl font-bold text-success mt-0.5">{okCount}</p>
        </Card>
        <Card className="p-3 text-center bg-warning/5 border-warning/20">
          <p className="text-[10px] uppercase font-bold text-warning/80">
            Low Stock
          </p>
          <p className="text-xl font-bold text-warning mt-0.5">
            {items.filter((i) => values[i.id]?.status === "low").length}
          </p>
        </Card>
        <Card className="p-3 text-center bg-danger/5 border-danger/20">
          <p className="text-[10px] uppercase font-bold text-danger/80">
            Out of Stock
          </p>
          <p className="text-xl font-bold text-danger mt-0.5">
            {items.filter((i) => values[i.id]?.status === "out").length}
          </p>
        </Card>
        {totalValue !== null && (
          <Card className="p-3 text-center bg-warm/5 border-warm/20">
            <p className="text-[10px] uppercase font-bold text-warm/80">
              Stock Value
            </p>
            <p className="text-lg font-bold text-warm mt-0.5">
              ₹{Math.round(totalValue).toLocaleString("en-IN")}
            </p>
          </Card>
        )}
      </div>

      {/* Tab filters */}
      <div className="flex gap-0 border-b border-border pb-px">
        {(
          [
            { id: "all" as Tab, label: `All (${items.length})` },
            {
              id: "at_risk" as Tab,
              label: `At Risk (${atRiskCount})`,
              alert: atRiskCount > 0,
            },
            { id: "ok" as Tab, label: `OK (${okCount})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative pb-2.5 px-1 mr-4 text-sm font-semibold transition-colors",
              "after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:rounded-full after:transition-all",
              activeTab === tab.id
                ? "alert" in tab && tab.alert
                  ? "text-danger after:bg-danger"
                  : "text-white after:bg-white"
                : "text-content-secondary hover:text-content-primary after:bg-transparent",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main form */}
      <form action={formAction} className="space-y-3">
        {grouped.length === 0 ? (
          <EmptyState
            icon={Package}
            title={
              activeTab === "at_risk"
                ? "No at-risk items!"
                : "No items found"
            }
            description={
              activeTab === "at_risk"
                ? "Everything is well-stocked. Nice work."
                : "No items match your search. Click 'Add' above to create one."
            }
            className="py-12"
          />
        ) : (
          grouped.map((group) => {
            const sum = categorySummary[group.category] ?? {
              ok: 0,
              low: 0,
              out: 0,
            };
            const isCollapsed = collapsedCats.has(group.category);

            return (
              <Card key={group.category} className="overflow-hidden">
                {/* Category header — tap to collapse/expand */}
                <button
                  type="button"
                  onClick={() => toggleCategory(group.category)}
                  className="w-full flex items-center justify-between px-4 py-3 border-b border-border bg-bg-elevated/30 hover:bg-bg-elevated/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-warm">
                      {group.category}
                    </h2>
                    <span className="text-[11px] text-content-secondary">
                      {group.items.length} item
                      {group.items.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {sum.out > 0 && (
                      <span className="text-[10px] font-bold text-danger bg-danger/10 px-1.5 py-0.5 rounded-full">
                        {sum.out} out
                      </span>
                    )}
                    {sum.low > 0 && (
                      <span className="text-[10px] font-bold text-warning bg-warning/10 px-1.5 py-0.5 rounded-full">
                        {sum.low} low
                      </span>
                    )}
                    {sum.ok > 0 && (
                      <span className="text-[10px] font-bold text-success bg-success/10 px-1.5 py-0.5 rounded-full">
                        {sum.ok} ok
                      </span>
                    )}
                    {isCollapsed ? (
                      <ChevronRight className="size-4 text-content-secondary ml-1" />
                    ) : (
                      <ChevronDown className="size-4 text-content-secondary ml-1" />
                    )}
                  </div>
                </button>

                {/* Item rows */}
                {!isCollapsed && (
                  <div className="divide-y divide-border">
                    {group.items.map((item) => {
                      const v = values[item.id];
                      if (!v) return null;
                      const meta = STOCK_STATUS_META[v.status];
                      const qtyNum = parseFloat(v.current_qty);
                      const hasQty = v.current_qty !== "" && !isNaN(qtyNum);
                      const isAtRisk =
                        v.status === "low" || v.status === "out";
                      const step = getQtyStep(v.current_unit);

                      // Min-qty progress bar
                      const progressPct =
                        item.min_qty != null && hasQty
                          ? Math.min(
                              100,
                              Math.round((qtyNum / item.min_qty) * 100),
                            )
                          : null;

                      // Per-item stock value
                      const itemValue =
                        item.price_per_unit != null && hasQty
                          ? qtyNum * item.price_per_unit
                          : null;

                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "px-4 py-4 space-y-3 transition-colors",
                            v.status === "out" && "bg-danger/[0.04]",
                            v.status === "low" && "bg-warning/[0.04]",
                          )}
                        >
                          {/* Row 1: Name + status toggle buttons */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 pt-0.5">
                              <span
                                className={cn(
                                  "text-sm font-bold leading-tight",
                                  v.status === "out" && "text-danger",
                                  v.status === "low" && "text-warning",
                                  v.status === "available" &&
                                    "text-content-primary",
                                )}
                              >
                                {item.name}
                              </span>
                              {item.min_qty != null &&
                                hasQty &&
                                qtyNum < item.min_qty && (
                                  <span className="ml-2 text-[10px] font-semibold text-warning bg-warning/10 px-1.5 py-0.5 rounded-full">
                                    Below min
                                  </span>
                                )}
                            </div>
                            <div className="flex gap-1 shrink-0">
                              {STATUSES.map((s) => {
                                const m = STOCK_STATUS_META[s];
                                const active = v.status === s;
                                return (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={() => setStatus(item.id, s)}
                                    className={cn(
                                      "flex size-9 items-center justify-center rounded-lg border text-base transition-all",
                                      active
                                        ? statusTone(m.tone)
                                        : "border-border bg-bg-elevated opacity-50 hover:opacity-80",
                                    )}
                                    aria-label={m.label}
                                    title={m.label}
                                  >
                                    {m.icon}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Row 2: Qty with +/- controls */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-content-secondary font-medium w-24 shrink-0">
                              Current Stock:
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => adjustQty(item.id, -step)}
                                className="flex size-7 items-center justify-center rounded-lg border border-border bg-bg-elevated hover:bg-bg-card transition-colors"
                                aria-label="Decrease"
                              >
                                <Minus className="size-3" />
                              </button>
                              <Input
                                type="number"
                                step="any"
                                min="0"
                                value={v.current_qty}
                                onChange={(e) =>
                                  handleQtyChange(item.id, e.target.value)
                                }
                                placeholder="0"
                                className="h-8 text-sm font-semibold text-center w-20 bg-bg-elevated/20"
                              />
                              <button
                                type="button"
                                onClick={() => adjustQty(item.id, step)}
                                className="flex size-7 items-center justify-center rounded-lg border border-border bg-bg-elevated hover:bg-bg-card transition-colors"
                                aria-label="Increase"
                              >
                                <Plus className="size-3" />
                              </button>
                              <select
                                value={v.current_unit}
                                onChange={(e) =>
                                  updateField(
                                    item.id,
                                    "current_unit",
                                    e.target.value,
                                  )
                                }
                                className="h-8 text-xs bg-bg-elevated border border-border rounded-lg px-2 text-content-primary"
                              >
                                {UNITS.map((unit) => (
                                  <option key={unit} value={unit}>
                                    {unit}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {itemValue !== null && (
                              <span className="ml-auto text-xs text-content-secondary tabular-nums">
                                ₹
                                {Math.round(itemValue).toLocaleString("en-IN")}
                              </span>
                            )}
                          </div>

                          {/* Row 3: Min-stock progress bar */}
                          {progressPct !== null && (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-[10px] text-content-secondary">
                                <span>
                                  {hasQty ? qtyNum : 0} {v.current_unit} in
                                  stock
                                </span>
                                <span>
                                  Min: {item.min_qty}{" "}
                                  {item.min_unit ?? v.current_unit}
                                </span>
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-bg-elevated overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all duration-300",
                                    progressPct >= 100 && "bg-success",
                                    progressPct >= 50 &&
                                      progressPct < 100 &&
                                      "bg-warning",
                                    progressPct < 50 && "bg-danger",
                                  )}
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Row 4: Reorder details (low / out only) */}
                          {isAtRisk && (
                            <div className="grid grid-cols-1 gap-2.5 border-t border-border/50 pt-3 sm:grid-cols-4">
                              <div>
                                <label className="text-[10px] uppercase tracking-wider text-content-secondary font-bold">
                                  Qty required
                                </label>
                                <div className="flex gap-1.5 mt-1">
                                  <Input
                                    type="number"
                                    step="any"
                                    min="0"
                                    value={v.qty_required}
                                    onChange={(e) =>
                                      updateField(
                                        item.id,
                                        "qty_required",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Qty"
                                    className="h-8 text-xs font-normal flex-1"
                                  />
                                  <select
                                    value={v.qty_required_unit}
                                    onChange={(e) =>
                                      updateField(
                                        item.id,
                                        "qty_required_unit",
                                        e.target.value,
                                      )
                                    }
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
                                  onChange={(e) =>
                                    updateField(
                                      item.id,
                                      "needed_by_date",
                                      e.target.value,
                                    )
                                  }
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
                                  onChange={(e) =>
                                    updateField(
                                      item.id,
                                      "needed_by_time",
                                      e.target.value,
                                    )
                                  }
                                  className="mt-1 h-8 text-xs font-normal"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] uppercase tracking-wider text-content-secondary font-bold">
                                  Notes / Urgency
                                </label>
                                <Input
                                  value={v.note}
                                  onChange={(e) =>
                                    updateField(
                                      item.id,
                                      "note",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="e.g. urgent, event order"
                                  className="mt-1 h-8 text-xs font-normal"
                                />
                              </div>
                            </div>
                          )}

                          {/* Hidden fields for form submission */}
                          <input
                            type="hidden"
                            name={`status_${item.id}`}
                            value={v.status}
                          />
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
                          <input
                            type="hidden"
                            name={`note_${item.id}`}
                            value={v.note}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })
        )}

        {/* Order list */}
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <ShoppingCart className="size-4 text-warm" />
            <h2 className="text-sm font-semibold">Items to Order</h2>
            <Badge variant={orderList.length ? "warning" : "default"}>
              {orderList.length}
            </Badge>
          </div>
          {orderList.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-content-secondary">
              <CheckCircle2 className="size-4 text-success shrink-0" />
              Everything in stock — nothing to reorder.
            </div>
          ) : (
            <ul className="space-y-2">
              {orderList.map((i) => {
                const val = values[i.id];
                if (!val) return null;
                const isOut = val.status === "out";
                return (
                  <li
                    key={i.id}
                    className={cn(
                      "rounded-xl border p-3 text-sm",
                      isOut
                        ? "border-danger/30 bg-danger/5"
                        : "border-warning/30 bg-warning/5",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-content-primary">
                            {i.name}
                          </span>
                          <Badge variant={isOut ? "danger" : "warning"}>
                            {STOCK_STATUS_META[val.status].label}
                          </Badge>
                          {i.category && (
                            <span className="text-[10px] text-content-secondary bg-bg-elevated px-1.5 py-0.5 rounded-full">
                              {i.category}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-content-secondary">
                          {val.current_qty && (
                            <span>
                              Have: {val.current_qty} {val.current_unit}
                            </span>
                          )}
                          {val.qty_required && (
                            <span className="font-semibold text-content-primary">
                              Need: {val.qty_required} {val.qty_required_unit}
                            </span>
                          )}
                          {(val.needed_by_date || val.needed_by_time) && (
                            <span>
                              By:{" "}
                              {val.needed_by_date
                                ? formatDateLabel(val.needed_by_date)
                                : ""}
                              {val.needed_by_time && ` ${val.needed_by_time}`}
                            </span>
                          )}
                        </div>
                        {val.note && (
                          <p className="mt-0.5 text-xs italic text-content-secondary">
                            &ldquo;{val.note}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
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
