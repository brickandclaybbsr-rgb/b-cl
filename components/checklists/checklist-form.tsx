"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { toast } from "sonner";
import { Camera, Check, X, TrendingDown, TrendingUp, CheckCircle2, Banknote, ArrowRight } from "lucide-react";
import type { ChecklistItemDef } from "@/lib/constants";
import {
  type ChecklistFormState,
} from "@/app/(app)/checklist/actions";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";
import { Confetti } from "@/components/ui/confetti";
import { cn, formatINR } from "@/lib/utils";

function getTodayIST(): string {
  const now = new Date();
  const istMs = now.getTime() + 5.5 * 60 * 60 * 1000;
  const ist = new Date(istMs);
  if (ist.getUTCHours() < 4) ist.setUTCDate(ist.getUTCDate() - 1);
  return ist.toISOString().slice(0, 10);
}

type Action = (
  prev: ChecklistFormState,
  formData: FormData,
) => Promise<ChecklistFormState>;

export function ChecklistForm({
  variant,
  config,
  action,
  team,
  hiddenFields,
  prevClosingBalance,
  reminderSales,
  promptCheckout,
}: {
  variant: "opening" | "closing";
  config: ChecklistItemDef[];
  action: Action;
  team?: "kitchen" | "front_desk" | null;
  hiddenFields?: Record<string, string>;
  prevClosingBalance?: number;
  reminderSales?: boolean;
  /** Closing only: employee is checked in but not out — send them to scan out. */
  promptCheckout?: boolean;
}) {
  // Kitchen team (incl. head chef, who maps to "kitchen") doesn't handle cash
  const showCashFields = team !== "kitchen";
  const [state, formAction] = useFormState<ChecklistFormState, FormData>(
    action,
    {},
  );
  const [showConfetti, setShowConfetti] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [openingCashRaw, setOpeningCashRaw] = useState("");

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.ok) {
      toast.success("Checklist submitted ✓");
      setShowConfetti(true);

      if (variant === "closing" && reminderSales) {
        const timer = setTimeout(async () => {
          const today = getTodayIST();
          const db = createClient();
          const { data } = await db
            .from("daily_sales")
            .select("id")
            .eq("date", today)
            .maybeSingle();
          if (!data) setShowReminder(true);
        }, 3000);
        return () => clearTimeout(timer);
      }

      // Closing checklist done and still checked in → send them to the scanner
      // to complete check-out.
      if (variant === "closing" && promptCheckout) {
        const timer = setTimeout(() => {
          window.location.assign("/attendance/checkin");
        }, 2500);
        return () => clearTimeout(timer);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Discrepancy logic
  const openingCash = parseFloat(openingCashRaw);
  const hasPrev = prevClosingBalance !== undefined && prevClosingBalance !== null;
  const cashEntered = openingCashRaw !== "" && !isNaN(openingCash);
  const discrepancy = hasPrev && cashEntered ? openingCash - prevClosingBalance! : null;
  const isShort = discrepancy !== null && discrepancy < 0;
  const isExcess = discrepancy !== null && discrepancy > 0;
  const isMatch = discrepancy !== null && discrepancy === 0;

  // group items while preserving the flat index used for field names
  const grouped: { section: string; items: { def: ChecklistItemDef; index: number }[] }[] =
    [];
  config.forEach((def, index) => {
    let bucket = grouped.find((g) => g.section === def.section);
    if (!bucket) {
      bucket = { section: def.section, items: [] };
      grouped.push(bucket);
    }
    bucket.items.push({ def, index });
  });

  return (
    <>
    <Confetti active={showConfetti} />

    {showReminder && (
      <div
        className="fixed inset-0 z-[200] flex items-end justify-center p-4 pb-10"
        onClick={() => setShowReminder(false)}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div
          className="relative w-full max-w-sm rounded-2xl border border-border bg-bg-card p-5 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-warning/15">
            <Banknote className="size-5 text-warning" />
          </div>
          <p className="text-base font-bold text-content-primary">Quick reminder</p>
          <p className="mt-1 text-sm text-content-secondary leading-relaxed">
            Today&apos;s <span className="font-semibold text-content-primary">daily sales</span> haven&apos;t been filed yet. Don&apos;t forget to file them before closing!
          </p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setShowReminder(false)}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-content-secondary"
            >
              Dismiss
            </button>
            <a
              href="/sales"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-fire px-4 py-2.5 text-sm font-bold text-white"
            >
              Go file it now
              <ArrowRight className="size-4" />
            </a>
          </div>
        </div>
      </div>
    )}

    <form action={formAction} className="space-y-4" encType="multipart/form-data">
      {hiddenFields && Object.entries(hiddenFields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      {grouped.map((group) => (
        <Card key={group.section} className="overflow-hidden">
          <div className="border-b border-border px-4 py-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-warm">
              {group.section}
            </h2>
          </div>
          <div className="divide-y divide-border">
            {group.items.map(({ def, index }) => (
              <CheckRow key={index} index={index} label={def.label} />
            ))}
          </div>
        </Card>
      ))}

      {variant === "opening" ? (
        <Card className="space-y-4 p-4">
          {showCashFields && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="opening_cash">Opening cash in drawer (₹)</Label>
                <Input
                  id="opening_cash"
                  name="opening_cash"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  className="font-mono"
                  value={openingCashRaw}
                  onChange={(e) => setOpeningCashRaw(e.target.value)}
                />
              </div>

              {/* Match indicator */}
              {isMatch && (
                <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-xs font-semibold text-success">
                  <CheckCircle2 className="size-4 shrink-0" />
                  Matches yesterday&apos;s closing cash
                </div>
              )}

              {/* Shortage */}
              {isShort && (
                <div className="space-y-3 rounded-xl border border-danger/30 bg-danger/8 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-danger">
                      <TrendingDown className="size-4" />
                      Short by
                    </div>
                    <span className="font-mono text-sm font-bold text-danger">
                      {formatINR(Math.abs(discrepancy!))}
                    </span>
                  </div>
                  <input type="hidden" name="cash_discrepancy" value={discrepancy!} />
                  <div className="space-y-1">
                    <Label htmlFor="cash_discrepancy_reason" className="text-xs">Reason for shortage</Label>
                    <Input
                      id="cash_discrepancy_reason"
                      name="cash_discrepancy_reason"
                      placeholder="e.g. ₹200 used for change, etc."
                      className="text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Excess */}
              {isExcess && (
                <div className="space-y-3 rounded-xl border border-warning/30 bg-warning/8 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-warning">
                      <TrendingUp className="size-4" />
                      Extra cash
                    </div>
                    <span className="font-mono text-sm font-bold text-warning">
                      +{formatINR(discrepancy!)}
                    </span>
                  </div>
                  <input type="hidden" name="cash_discrepancy" value={discrepancy!} />
                  <div className="space-y-1">
                    <Label htmlFor="cash_discrepancy_reason" className="text-xs">Reason for extra cash</Label>
                    <Input
                      id="cash_discrepancy_reason"
                      name="cash_discrepancy_reason"
                      placeholder="e.g. refund received, etc."
                      className="text-sm"
                    />
                  </div>
                </div>
              )}
            </>
          )}
          <NotesField />
        </Card>
      ) : (
        <Card className="space-y-4 p-4">
          {showCashFields && (
            <div className="space-y-1.5">
              <Label htmlFor="closing_cash">Closing cash (₹)</Label>
              <Input
                id="closing_cash"
                name="closing_cash"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0"
                className="font-mono"
              />
            </div>
          )}
          {showCashFields && (
            <div className="space-y-1.5">
              <Label htmlFor="discrepancy_notes">Cash discrepancy notes</Label>
              <Input
                id="discrepancy_notes"
                name="discrepancy_notes"
                placeholder="e.g. ₹50 short — explained"
              />
            </div>
          )}
          <NotesField />
        </Card>
      )}

      <SubmitButton className="w-full" size="lg" pendingText="Submitting…">
        Submit {variant} checklist
      </SubmitButton>
      <p className="pb-2 text-center text-xs text-content-secondary">
        Once submitted, today&apos;s checklist can&apos;t be edited.
      </p>
    </form>
    </>
  );
}

function CheckRow({ index, label }: { index: number; label: string }) {
  const [checked, setChecked] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const noteRef = useRef<HTMLInputElement>(null);

  return (
    <div className="px-4 py-1">
      <label className="flex cursor-pointer items-center gap-3 py-2.5">
        {/* hidden real checkbox drives the form value */}
        <input
          type="checkbox"
          name={`check_${index}`}
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="peer sr-only"
        />
        <span
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
            checked
              ? "border-success bg-success text-white"
              : "border-border bg-bg-elevated",
          )}
        >
          {checked && <Check className="size-4" strokeWidth={3} />}
        </span>
        <span
          className={cn(
            "flex-1 text-sm transition-colors",
            checked ? "text-content-primary" : "text-content-secondary",
          )}
        >
          {label}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setShowNote((s) => !s);
            setTimeout(() => noteRef.current?.focus(), 0);
          }}
          className="text-xs font-medium text-content-secondary hover:text-warm"
        >
          {showNote ? "—" : "Note"}
        </button>
      </label>
      {showNote && (
        <Input
          ref={noteRef}
          name={`note_${index}`}
          placeholder="Add a note for this item"
          className="mb-2 h-9 text-xs"
        />
      )}
    </div>
  );
}

function NotesField() {
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  }

  function clearPhoto() {
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes / issues</Label>
        <Textarea id="notes" name="notes" placeholder="Anything to flag for the owner?" />
      </div>
      <div className="space-y-1.5">
        <div>
          <p className="text-xs font-medium text-content-primary">Photo</p>
          <p className="text-xs text-content-secondary">If there&apos;s any issue or something to flag, add a photo — not mandatory</p>
        </div>
        <input
          ref={fileRef}
          type="file"
          name="photo"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFile}
        />
        {preview ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Preview" className="h-40 w-full rounded-xl object-cover" />
            <button
              type="button"
              onClick={clearPhoto}
              className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-5 text-sm text-content-secondary transition-colors hover:border-border-strong hover:text-content-primary"
          >
            <Camera className="size-4" />
            Add photo
          </button>
        )}
      </div>
    </div>
  );
}
