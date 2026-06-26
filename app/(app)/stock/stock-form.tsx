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
  AlertTriangle,
  Flame,
  TrendingDown,
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
  "kg","gm","litre","ml","box","pouch","packet",
  "can","bottle","piece","crate","sack","tin","bag","bundle",
];

function getQtyStep(unit: string): number {
  if (["kg","litre"].includes(unit)) return 0.5;
  if (["gm","ml"].includes(unit)) return 100;
  return 1;
}

function statusTone(t: "success" | "warning" | "danger") {
  return {
    success: "border-success bg-success/20 text-success",
    warning: "border-warning bg-warning/20 text-warning",
    danger:  "border-danger  bg-danger/20  text-danger",
  }[t];
}

function daysLabel(days: number): string {
  if (days <= 0) return "0 days";
  if (days < 1)  return "<1 day";
  return `~${Math.round(days)} day${Math.round(days) === 1 ? "" : "s"}`;
}

export function StockForm({
  items,
  initial,
  lastSnapshot,
  consumptionMap,
}: {
  items: StockItem[];
  initial: Record<string, StockLine>;
  lastSnapshot: StockSnapshot | null;
  consumptionMap: Record<string, number>;
}) {
  const [state, formAction] = useFormState<StockFormState, FormData>(submitStock, {});

  const [values, setValues] = useState<Record<string, ItemState>>(() => {
    const v: Record<string, ItemState> = {};
    for (const item of items) {
      const prev = initial[item.id];
      v[item.id] = {
        status:            (prev?.status as StockStatus) ?? "available",
        current_qty:       prev?.current_qty !== undefined ? String(prev.current_qty) : "",
        current_unit:      prev?.current_unit ?? item.min_unit ?? "kg",
        qty_required:      prev?.qty_required !== undefined ? String(prev.qty_required) : "",
        qty_required_unit: prev?.qty_required_unit ?? item.min_unit ?? "kg",
        needed_by_date:    prev?.needed_by_date ?? "",
        needed_by_time:    prev?.needed_by_time ?? "",
        note:              prev?.note ?? "",
      };
    }
    return v;
  });

  // Keep new inline-added items in sync
  useEffect(() => {
    setValues((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const item of items) {
        if (!next[item.id]) {
          next[item.id] = {
            status: "available", current_qty: "", current_unit: item.min_unit ?? "kg",
            qty_required: "", qty_required_unit: item.min_unit ?? "kg",
            needed_by_date: "", needed_by_time: "", note: "",
          };
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [items]);

  const [search, setSearch]             = useState("");
  const [isAdding, startAdding]         = useTransition();
  const [showConfetti, setShowConfetti] = useState(false);
  const [activeTab, setActiveTab]       = useState<Tab>("all");
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());

  // Add-item modal state
  const [showAddModal, setShowAddModal]         = useState(false);
  const [newItemName, setNewItemName]           = useState("");
  const [newItemCat, setNewItemCat]             = useState("");
  const [newItemCustomCat, setNewItemCustomCat] = useState("");
  const [newItemMinQty, setNewItemMinQty]       = useState("");
  const [newItemMinUnit, setNewItemMinUnit]     = useState("kg");
  const [newItemPrice, setNewItemPrice]         = useState("");

  function openAddModal() {
    setNewItemName(""); setNewItemCat(""); setNewItemCustomCat("");
    setNewItemMinQty(""); setNewItemMinUnit("kg"); setNewItemPrice("");
    setShowAddModal(true);
  }
  function closeAddModal() { setShowAddModal(false); }

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.ok) { toast.success("Stock saved ✓"); setShowConfetti(true); }
  }, [state]);

  const categories = useMemo(() => {
    const s = new Set<string>();
    items.forEach(i => { if (i.category) s.add(i.category); });
    return Array.from(s).sort();
  }, [items]);

  // Auto-status when qty changes
  function handleQtyChange(id: string, qty: string) {
    const item = items.find(i => i.id === id);
    const n = parseFloat(qty);
    setValues(v => {
      let status = v[id]?.status ?? "available";
      if (qty !== "" && !isNaN(n)) {
        if (n === 0) status = "out";
        else if (item?.min_qty != null && n < item.min_qty && status === "available") status = "low";
        else if (n > 0 && status === "out") status = "available";
      }
      return { ...v, [id]: { ...v[id], current_qty: qty, status } };
    });
  }

  function adjustQty(id: string, delta: number) {
    const v = values[id];
    if (!v) return;
    const next = Math.max(0, +(( parseFloat(v.current_qty) || 0) + delta).toFixed(3));
    handleQtyChange(id, String(next));
  }

  function setStatus(id: string, status: StockStatus) {
    setValues(v => ({ ...v, [id]: { ...v[id], status } }));
  }

  function updateField(id: string, field: keyof ItemState, value: string) {
    setValues(v => ({ ...v, [id]: { ...v[id], [field]: value } }));
  }

  // Days remaining for an item given its current qty
  function daysRemaining(itemId: string, qtyStr: string): number | null {
    const avg = consumptionMap[itemId];
    if (!avg || avg <= 0) return null;
    const qty = parseFloat(qtyStr);
    if (isNaN(qty) || qty < 0) return null;
    return qty / avg;
  }

  // Risk level: 0=ok, 1=low, 2=critical (out or days<2)
  function riskLevel(itemId: string, status: StockStatus, qtyStr: string): 0 | 1 | 2 {
    if (status === "out") return 2;
    const days = daysRemaining(itemId, qtyStr);
    if (status === "low") return days !== null && days < 2 ? 2 : 1;
    if (days !== null && days < 1) return 2;
    if (days !== null && days < 2) return 1;
    return 0;
  }

  // Tab + search filter
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.category ?? "").toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      const status = values[item.id]?.status ?? "available";
      if (activeTab === "at_risk") return status === "low" || status === "out";
      if (activeTab === "ok") return status === "available";
      return true;
    });
  }, [items, search, values, activeTab]);

  // Group by category, sort items within each group: critical → low → ok
  const grouped = useMemo(() => {
    const map: Record<string, StockItem[]> = {};
    for (const item of filteredItems) {
      const cat = item.category ?? "Other";
      if (!map[cat]) map[cat] = [];
      map[cat].push(item);
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([category, catItems]) => ({
        category,
        items: [...catItems].sort((a, b) => {
          const ra = riskLevel(a.id, values[a.id]?.status ?? "available", values[a.id]?.current_qty ?? "");
          const rb = riskLevel(b.id, values[b.id]?.status ?? "available", values[b.id]?.current_qty ?? "");
          return rb - ra;
        }),
      }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredItems, values, consumptionMap]);

  // Category summary (over all items, not filtered)
  const catSummary = useMemo(() => {
    const s: Record<string, { ok: number; low: number; out: number }> = {};
    for (const item of items) {
      const cat = item.category ?? "Other";
      if (!s[cat]) s[cat] = { ok: 0, low: 0, out: 0 };
      const st = values[item.id]?.status ?? "available";
      if (st === "available") s[cat].ok++;
      else if (st === "low")  s[cat].low++;
      else                    s[cat].out++;
    }
    return s;
  }, [items, values]);

  const atRiskCount   = items.filter(i => { const s = values[i.id]?.status; return s === "low" || s === "out"; }).length;
  const criticalItems = items.filter(i => riskLevel(i.id, values[i.id]?.status ?? "available", values[i.id]?.current_qty ?? "") === 2);
  const okCount       = items.filter(i => values[i.id]?.status === "available").length;
  const orderList     = items.filter(i => values[i.id]?.status === "low" || values[i.id]?.status === "out");

  const totalValue = useMemo(() => {
    let total = 0; let hasAny = false;
    for (const item of items) {
      if (!item.price_per_unit) continue;
      const qty = parseFloat(values[item.id]?.current_qty ?? "");
      if (!isNaN(qty)) { total += qty * item.price_per_unit; hasAny = true; }
    }
    return hasAny ? total : null;
  }, [items, values]);

  async function handleAddInline(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemName.trim()) return;
    const category = newItemCat === "__new__" ? newItemCustomCat : newItemCat;
    const minQty   = newItemMinQty  ? parseFloat(newItemMinQty)  : undefined;
    const price    = newItemPrice   ? parseFloat(newItemPrice)   : undefined;
    startAdding(async () => {
      const res = await addStockItemInline(newItemName, category, {
        min_qty: isNaN(minQty!) ? undefined : minQty,
        min_unit: newItemMinQty ? newItemMinUnit : undefined,
        price_per_unit: isNaN(price!) ? undefined : price,
      });
      if (res?.error) toast.error(res.error);
      else {
        toast.success(`"${newItemName}" added ✓`);
        closeAddModal();
      }
    });
  }

  return (
    <div className="space-y-4">
      <Confetti active={showConfetti} />

      {/* ── Critical alert banner ── */}
      {criticalItems.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-danger/40 bg-danger/10 p-3.5">
          <Flame className="mt-0.5 size-4 shrink-0 text-danger" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-danger">
              {criticalItems.length} item{criticalItems.length > 1 ? "s" : ""} critically low — order now
            </p>
            <p className="mt-0.5 text-xs text-content-secondary line-clamp-2">
              {criticalItems.map(i => i.name).join(" · ")}
            </p>
          </div>
        </div>
      )}

      {/* ── Last updated ── */}
      {lastSnapshot && (
        <div className="flex items-center gap-1.5 text-xs text-content-secondary">
          <Clock className="size-3.5 shrink-0" />
          Last updated {formatDateLabel(lastSnapshot.date)}
          {lastSnapshot.submitted_at && (
            <> at {new Date(lastSnapshot.submitted_at).toLocaleTimeString("en-IN", {
              hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata",
            })}</>
          )}
        </div>
      )}

      {/* ── Search ── */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-content-secondary" />
        <Input
          placeholder="Search by name or category…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 h-10 text-sm bg-bg-card border-border"
        />
      </div>

      {/* ── Metrics ── */}
      <div className={cn("grid gap-2", totalValue !== null ? "grid-cols-4" : "grid-cols-3")}>
        <Card className="p-3 text-center bg-success/5 border-success/20">
          <p className="text-[10px] uppercase font-bold text-success/80">Available</p>
          <p className="text-xl font-bold text-success mt-0.5">{okCount}</p>
        </Card>
        <Card className="p-3 text-center bg-warning/5 border-warning/20">
          <p className="text-[10px] uppercase font-bold text-warning/80">Low</p>
          <p className="text-xl font-bold text-warning mt-0.5">
            {items.filter(i => values[i.id]?.status === "low").length}
          </p>
        </Card>
        <Card className="p-3 text-center bg-danger/5 border-danger/20">
          <p className="text-[10px] uppercase font-bold text-danger/80">Out</p>
          <p className="text-xl font-bold text-danger mt-0.5">
            {items.filter(i => values[i.id]?.status === "out").length}
          </p>
        </Card>
        {totalValue !== null && (
          <Card className="p-3 text-center bg-warm/5 border-warm/20">
            <p className="text-[10px] uppercase font-bold text-warm/80">Value</p>
            <p className="text-lg font-bold text-warm mt-0.5">
              ₹{Math.round(totalValue).toLocaleString("en-IN")}
            </p>
          </Card>
        )}
      </div>

      {/* ── Tab filters ── */}
      <div className="flex border-b border-border pb-px">
        {([
          { id: "all"     as Tab, label: `All (${items.length})` },
          { id: "at_risk" as Tab, label: `At Risk (${atRiskCount})`, alert: atRiskCount > 0 },
          { id: "ok"      as Tab, label: `OK (${okCount})` },
        ]).map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative pb-2.5 px-1 mr-4 text-sm font-semibold transition-colors",
              "after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:rounded-full after:transition-all",
              activeTab === tab.id
                ? ("alert" in tab && tab.alert ? "text-danger after:bg-danger" : "text-white after:bg-white")
                : "text-content-secondary hover:text-content-primary after:bg-transparent",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Main form ── */}
      <form action={formAction} className="space-y-3">
        {grouped.length === 0 ? (
          <EmptyState
            icon={Package}
            title={activeTab === "at_risk" ? "No at-risk items!" : "No items found"}
            description={activeTab === "at_risk" ? "Everything is well-stocked." : "No items match your search."}
            className="py-12"
          />
        ) : (
          grouped.map(group => {
            const sum = catSummary[group.category] ?? { ok: 0, low: 0, out: 0 };
            const collapsed = collapsedCats.has(group.category);
            return (
              <Card key={group.category} className="overflow-hidden">
                {/* Category header */}
                <button
                  type="button"
                  onClick={() => setCollapsedCats(prev => {
                    const next = new Set(prev);
                    if (next.has(group.category)) next.delete(group.category); else next.add(group.category);
                    return next;
                  })}
                  className="w-full flex items-center justify-between px-4 py-3 border-b border-border bg-bg-elevated/30 hover:bg-bg-elevated/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-warm">{group.category}</h2>
                    <span className="text-[11px] text-content-secondary">{group.items.length} items</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {sum.out > 0 && <span className="text-[10px] font-bold text-danger  bg-danger/10  px-1.5 py-0.5 rounded-full">{sum.out} out</span>}
                    {sum.low > 0 && <span className="text-[10px] font-bold text-warning bg-warning/10 px-1.5 py-0.5 rounded-full">{sum.low} low</span>}
                    {sum.ok  > 0 && <span className="text-[10px] font-bold text-success bg-success/10 px-1.5 py-0.5 rounded-full">{sum.ok} ok</span>}
                    {collapsed
                      ? <ChevronRight className="size-4 text-content-secondary ml-1" />
                      : <ChevronDown  className="size-4 text-content-secondary ml-1" />}
                  </div>
                </button>

                {/* Items */}
                {!collapsed && (
                  <div className="divide-y divide-border">
                    {group.items.map(item => {
                      const v = values[item.id];
                      if (!v) return null;

                      const qtyNum  = parseFloat(v.current_qty);
                      const hasQty  = v.current_qty !== "" && !isNaN(qtyNum);
                      const isAtRisk = v.status === "low" || v.status === "out";
                      const step    = getQtyStep(v.current_unit);
                      const risk    = riskLevel(item.id, v.status, v.current_qty);

                      const days    = daysRemaining(item.id, v.current_qty);
                      const avgDay  = consumptionMap[item.id];

                      const progressPct = (item.min_qty != null && hasQty)
                        ? Math.min(100, Math.round((qtyNum / item.min_qty) * 100))
                        : null;

                      const itemValue = (item.price_per_unit != null && hasQty)
                        ? qtyNum * item.price_per_unit
                        : null;

                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "px-4 py-3.5 space-y-2.5 transition-colors",
                            risk === 2 && "bg-danger/[0.05]",
                            risk === 1 && "bg-warning/[0.04]",
                          )}
                        >
                          {/* Row 1: name + status buttons */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 pt-0.5">
                              <span className={cn(
                                "text-sm font-bold leading-tight",
                                v.status === "out"       && "text-danger",
                                v.status === "low"       && "text-warning",
                                v.status === "available" && "text-content-primary",
                              )}>
                                {item.name}
                              </span>
                              {item.min_qty != null && hasQty && qtyNum < item.min_qty && (
                                <span className="ml-2 text-[10px] font-semibold text-warning bg-warning/15 px-1.5 py-0.5 rounded-full">
                                  Below min
                                </span>
                              )}
                            </div>
                            <div className="flex gap-1 shrink-0">
                              {STATUSES.map(s => {
                                const m = STOCK_STATUS_META[s];
                                const active = v.status === s;
                                return (
                                  <button key={s} type="button" onClick={() => setStatus(item.id, s)}
                                    className={cn(
                                      "flex size-9 items-center justify-center rounded-lg border text-base transition-all",
                                      active ? statusTone(m.tone) : "border-border bg-bg-elevated opacity-50 hover:opacity-80",
                                    )}
                                    aria-label={m.label} title={m.label}
                                  >
                                    {m.icon}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Row 2: qty controls */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-content-secondary font-medium w-24 shrink-0">Current Stock:</span>
                            <div className="flex items-center gap-1.5">
                              <button type="button" onClick={() => adjustQty(item.id, -step)}
                                className="flex size-7 items-center justify-center rounded-lg border border-border bg-bg-elevated hover:bg-bg-card transition-colors">
                                <Minus className="size-3" />
                              </button>
                              <Input
                                type="number" step="any" min="0"
                                value={v.current_qty}
                                onChange={e => handleQtyChange(item.id, e.target.value)}
                                placeholder="0"
                                className="h-8 text-sm font-semibold text-center w-20 bg-bg-elevated/20"
                              />
                              <button type="button" onClick={() => adjustQty(item.id, step)}
                                className="flex size-7 items-center justify-center rounded-lg border border-border bg-bg-elevated hover:bg-bg-card transition-colors">
                                <Plus className="size-3" />
                              </button>
                              <select
                                value={v.current_unit}
                                onChange={e => updateField(item.id, "current_unit", e.target.value)}
                                className="h-8 text-xs bg-bg-elevated border border-border rounded-lg px-2 text-content-primary"
                              >
                                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                              </select>
                            </div>
                            {itemValue !== null && (
                              <span className="ml-auto text-xs text-content-secondary tabular-nums">
                                ₹{Math.round(itemValue).toLocaleString("en-IN")}
                              </span>
                            )}
                          </div>

                          {/* Row 3: consumption trend + progress bar */}
                          {(avgDay || progressPct !== null) && (
                            <div className="space-y-1.5">
                              {avgDay && (
                                <div className={cn(
                                  "flex items-center gap-1.5 text-[11px]",
                                  days !== null && days < 2 ? "text-danger font-semibold" :
                                  days !== null && days < 5 ? "text-warning" : "text-content-secondary",
                                )}>
                                  <TrendingDown className="size-3 shrink-0" />
                                  <span>~{avgDay} {v.current_unit}/day</span>
                                  {days !== null && (
                                    <span className="font-bold">
                                      · {daysLabel(days)} left
                                    </span>
                                  )}
                                </div>
                              )}
                              {progressPct !== null && (
                                <div>
                                  <div className="flex justify-between text-[10px] text-content-secondary mb-1">
                                    <span>{hasQty ? qtyNum : 0} {v.current_unit}</span>
                                    <span>Min: {item.min_qty} {item.min_unit ?? v.current_unit}</span>
                                  </div>
                                  <div className="h-1.5 w-full rounded-full bg-bg-elevated overflow-hidden">
                                    <div
                                      className={cn(
                                        "h-full rounded-full transition-all duration-300",
                                        progressPct >= 100 ? "bg-success" :
                                        progressPct >= 50  ? "bg-warning" : "bg-danger",
                                      )}
                                      style={{ width: `${progressPct}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Row 4: reorder section (low/out only) */}
                          {isAtRisk && (
                            <div className="grid grid-cols-1 gap-2 border-t border-border/50 pt-3 sm:grid-cols-4">
                              <div>
                                <label className="text-[10px] uppercase tracking-wider text-content-secondary font-bold">Qty required</label>
                                <div className="flex gap-1.5 mt-1">
                                  <Input type="number" step="any" min="0" value={v.qty_required}
                                    onChange={e => updateField(item.id, "qty_required", e.target.value)}
                                    placeholder="Qty" className="h-8 text-xs flex-1" />
                                  <select value={v.qty_required_unit}
                                    onChange={e => updateField(item.id, "qty_required_unit", e.target.value)}
                                    className="h-8 text-xs bg-bg-elevated border border-border rounded-lg px-1 text-content-primary">
                                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                  </select>
                                </div>
                              </div>
                              <div>
                                <label className="text-[10px] uppercase tracking-wider text-content-secondary font-bold">Needed by Date</label>
                                <Input type="date" value={v.needed_by_date}
                                  onChange={e => updateField(item.id, "needed_by_date", e.target.value)}
                                  className="mt-1 h-8 text-xs" />
                              </div>
                              <div>
                                <label className="text-[10px] uppercase tracking-wider text-content-secondary font-bold">Needed by Time</label>
                                <Input type="time" value={v.needed_by_time}
                                  onChange={e => updateField(item.id, "needed_by_time", e.target.value)}
                                  className="mt-1 h-8 text-xs" />
                              </div>
                              <div>
                                <label className="text-[10px] uppercase tracking-wider text-content-secondary font-bold">Notes / Urgency</label>
                                <Input value={v.note}
                                  onChange={e => updateField(item.id, "note", e.target.value)}
                                  placeholder="urgent, event order…"
                                  className="mt-1 h-8 text-xs" />
                              </div>
                            </div>
                          )}

                          {/* Hidden fields */}
                          <input type="hidden" name={`status_${item.id}`}            value={v.status} />
                          <input type="hidden" name={`current_qty_${item.id}`}       value={v.current_qty} />
                          <input type="hidden" name={`current_unit_${item.id}`}      value={v.current_unit} />
                          <input type="hidden" name={`qty_required_${item.id}`}      value={v.qty_required} />
                          <input type="hidden" name={`qty_required_unit_${item.id}`} value={v.qty_required_unit} />
                          <input type="hidden" name={`needed_by_date_${item.id}`}    value={v.needed_by_date} />
                          <input type="hidden" name={`needed_by_time_${item.id}`}    value={v.needed_by_time} />
                          <input type="hidden" name={`note_${item.id}`}              value={v.note} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })
        )}

        {/* ── Order list ── */}
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <ShoppingCart className="size-4 text-warm" />
            <h2 className="text-sm font-semibold">Items to Order</h2>
            <Badge variant={orderList.length ? "warning" : "default"}>{orderList.length}</Badge>
          </div>
          {orderList.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-content-secondary">
              <CheckCircle2 className="size-4 text-success shrink-0" />
              Everything in stock — nothing to reorder.
            </div>
          ) : (
            <ul className="space-y-2">
              {orderList.map(i => {
                const val = values[i.id];
                if (!val) return null;
                const isOut = val.status === "out";
                const days = daysRemaining(i.id, val.current_qty);
                return (
                  <li key={i.id} className={cn(
                    "rounded-xl border p-3 text-sm",
                    isOut ? "border-danger/30 bg-danger/5" : "border-warning/30 bg-warning/5",
                  )}>
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className="font-bold text-content-primary">{i.name}</span>
                      <Badge variant={isOut ? "danger" : "warning"}>{STOCK_STATUS_META[val.status].label}</Badge>
                      {i.category && (
                        <span className="text-[10px] text-content-secondary bg-bg-elevated px-1.5 py-0.5 rounded-full">{i.category}</span>
                      )}
                      {days !== null && (
                        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                          days < 1 ? "text-danger bg-danger/10" : "text-warning bg-warning/10")}>
                          {daysLabel(days)} left
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-content-secondary">
                      {val.current_qty && <span>Have: {val.current_qty} {val.current_unit}</span>}
                      {val.qty_required && <span className="font-semibold text-content-primary">Need: {val.qty_required} {val.qty_required_unit}</span>}
                      {(val.needed_by_date || val.needed_by_time) && (
                        <span>By: {val.needed_by_date ? formatDateLabel(val.needed_by_date) : ""}{val.needed_by_time && ` ${val.needed_by_time}`}</span>
                      )}
                    </div>
                    {val.note && <p className="mt-0.5 text-xs italic text-content-secondary">&ldquo;{val.note}&rdquo;</p>}
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

      {/* ── Floating Add Item button ── */}
      <button
        type="button"
        onClick={openAddModal}
        className="fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-full bg-warm px-4 py-3 text-sm font-bold text-black shadow-lg shadow-warm/30 transition-transform active:scale-95 hover:bg-warm/90"
        aria-label="Add new stock item"
      >
        <Plus className="size-4" />
        Add Item
      </button>

      {/* ── Add Item bottom-sheet modal ── */}
      {showAddModal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={closeAddModal}
          />
          {/* Sheet */}
          <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-border bg-bg-card shadow-2xl animate-slide-up">
            {/* Drag handle */}
            <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-border" />

            <div className="px-5 pt-4 pb-2 flex items-center justify-between">
              <h2 className="text-base font-bold">Add New Stock Item</h2>
              <button type="button" onClick={closeAddModal}
                className="flex size-8 items-center justify-center rounded-full bg-bg-elevated text-content-secondary hover:text-content-primary transition-colors">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddInline} className="px-5 pb-8 pt-2 space-y-4">
              {/* Item name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-content-secondary">
                  Item Name <span className="text-danger">*</span>
                </label>
                <Input
                  autoFocus
                  placeholder="e.g. Mozzarella, Olive Oil, Flour…"
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  className="h-12 text-base"
                  required
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-content-secondary">Category</label>
                <select
                  value={newItemCat}
                  onChange={e => setNewItemCat(e.target.value)}
                  className="h-12 w-full rounded-xl border border-border bg-bg-elevated px-3 text-sm text-content-primary"
                >
                  <option value="">Select category…</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="__new__">+ Type new category…</option>
                </select>
                {newItemCat === "__new__" && (
                  <Input
                    autoFocus
                    placeholder="New category name…"
                    value={newItemCustomCat}
                    onChange={e => setNewItemCustomCat(e.target.value)}
                    className="h-11 text-sm"
                  />
                )}
              </div>

              {/* Min stock threshold */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-content-secondary">
                  Min Stock Threshold <span className="text-content-secondary font-normal">(optional — triggers "low" alert)</span>
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number" min="0" step="any"
                    placeholder="e.g. 5"
                    value={newItemMinQty}
                    onChange={e => setNewItemMinQty(e.target.value)}
                    className="h-11 flex-1 text-sm"
                  />
                  <select
                    value={newItemMinUnit}
                    onChange={e => setNewItemMinUnit(e.target.value)}
                    className="h-11 rounded-xl border border-border bg-bg-elevated px-3 text-sm text-content-primary"
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {/* Price per unit */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-content-secondary">
                  Price per Unit <span className="text-content-secondary font-normal">(optional — for stock value)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-content-secondary">₹</span>
                  <Input
                    type="number" min="0" step="any"
                    placeholder="0.00"
                    value={newItemPrice}
                    onChange={e => setNewItemPrice(e.target.value)}
                    className="h-11 pl-8 text-sm"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <Button type="button" variant="secondary" onClick={closeAddModal}
                  className="flex-1 h-12 text-sm">
                  Cancel
                </Button>
                <Button type="submit" disabled={isAdding || !newItemName.trim()}
                  className="flex-1 h-12 text-sm font-bold bg-warm text-black hover:bg-warm/90">
                  {isAdding ? "Adding…" : "Add Item"}
                </Button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
