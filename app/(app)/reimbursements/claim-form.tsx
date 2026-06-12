"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { toast } from "sonner";
import { submitReimbursementClaim, type ReimbursementFormState } from "./actions";
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

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.ok) {
      toast.success("Reimbursement claim submitted ✓");
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-warm">
        Submit Reimbursement Claim
      </h2>
      <form ref={formRef} action={formAction} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount Claimed (₹)</Label>
            <Input
              type="number"
              step="0.01"
              id="amount"
              name="amount"
              placeholder="e.g. 450.00"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="receipt">Receipt Image / Bill File</Label>
            <FileInput
              id="receipt"
              name="receipt"
              accept="image/*,application/pdf"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="purpose">Purpose of Expense</Label>
          <Input
            id="purpose"
            name="purpose"
            placeholder="e.g. Bought emergency wood charcoal from local market"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes / Explanation (optional)</Label>
          <Input id="notes" name="notes" placeholder="e.g. Approved by manager, paid via personal GPay" />
        </div>

        <SubmitButton className="w-full" pendingText="Submitting claim…">
          Submit Claim
        </SubmitButton>
      </form>
    </Card>
  );
}
