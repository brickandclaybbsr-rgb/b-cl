"use client";

import { useFormState } from "react-dom";
import { AlertCircle } from "lucide-react";
import { login, type LoginState } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useFormState<LoginState, FormData>(login, {});

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          placeholder="you@brickandclay.in"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />
      </div>

      {state.error && (
        <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <SubmitButton className="w-full" size="lg" pendingText="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}
