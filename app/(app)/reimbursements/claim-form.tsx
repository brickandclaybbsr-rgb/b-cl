"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { toast } from "sonner";
import { Wallet, Receipt, FileText } from "lucide-react";
import { submitReimbursementClaim, type ReimbursementFormState } from "./actions";
import { Confetti } from "@/components/ui/confetti";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileInput } from "@/components/ui/file-input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";

export function ReimbursementClaimForm() {
  const [state, formAction] = useFormState<ReimbursementFormState, FormData>(
    submitReimbursementClaim,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.ok) {
      toast.success("Expense recorded ✓");
      setShowConfetti(true);
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <>
    <Confetti active={showConfetti} />
    <Card className="p-4">
      <div className="mb-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-warm">
          Record Store Cash Expense
        </h2>
        <p className="mt-1 text-xs text-content-secondary">
          Use this when you&apos;ve already taken cash from the store drawer for a purchase. Upload the bill after buying.
        </p>
      </div>

      <form ref={formRef} action={formAction} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="amount" className="flex items-center gap-1.5">
              <Wallet className="size-3.5" /> Amount Spent (₹)
            </Label>
            <Input
              type="number"
              step="0.01"
              id="amount"
              name="amount"
              placeholder="e.g. 450"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="receipt" className="flex items-center gap-1.5">
              <Receipt className="size-3.5" /> Bill / Receipt (optional)
            </Label>
            <FileInput
              id="receipt"
              name="receipt"
              accept="image/*,application/pdf"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="purpose" className="flex items-center gap-1.5">
            <FileText className="size-3.5" /> What was purchased?
          </Label>
          <Input
            id="purpose"
            name="purpose"
            placeholder="e.g. Eggs, milk, cleaning supplies"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Additional notes (optional)</Label>
          <Input id="notes" name="notes" placeholder="e.g. Bought from local market near shop" />
        </div>

        <SubmitButton className="w-full" pendingText="Recording…">
          Record Expense
        </SubmitButton>
      </form>
    </Card>
    </>
  );
}
