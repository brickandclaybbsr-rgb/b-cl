"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { toast } from "sonner";
import { Check } from "lucide-react";
import type { ChecklistItemDef } from "@/lib/constants";
import {
  type ChecklistFormState,
} from "@/app/(app)/checklist/actions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";
import { Confetti } from "@/components/ui/confetti";
import { cn } from "@/lib/utils";

type Action = (
  prev: ChecklistFormState,
  formData: FormData,
) => Promise<ChecklistFormState>;

export function ChecklistForm({
  variant,
  config,
  action,
}: {
  variant: "opening" | "closing";
  config: ChecklistItemDef[];
  action: Action;
}) {
  const [state, formAction] = useFormState<ChecklistFormState, FormData>(
    action,
    {},
  );
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.ok) {
      toast.success("Checklist submitted ✓");
      setShowConfetti(true);
    }
  }, [state]);

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
    <form action={formAction} className="space-y-4">
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
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="absent_staff">Absent staff (if any)</Label>
            <Input
              id="absent_staff"
              name="absent_staff"
              placeholder="Names, comma separated"
            />
          </div>
          <NotesField />
        </Card>
      ) : (
        <Card className="space-y-4 p-4">
          <div className="grid grid-cols-2 gap-3">
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
            <div className="space-y-1.5">
              <Label htmlFor="cash_deposited">Deposited to safe (₹)</Label>
              <Input
                id="cash_deposited"
                name="cash_deposited"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0"
                className="font-mono"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="discrepancy_notes">Cash discrepancy notes</Label>
            <Input
              id="discrepancy_notes"
              name="discrepancy_notes"
              placeholder="e.g. ₹50 short — explained"
            />
          </div>
          
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
  return (
    <div className="space-y-1.5">
      <Label htmlFor="notes">Notes / issues</Label>
      <Textarea id="notes" name="notes" placeholder="Anything to flag for the owner?" />
    </div>
  );
}
