"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2, KeyRound, Loader2 } from "lucide-react";
import type { ActionState } from "@/app/(app)/settings/actions";
import { cn } from "@/lib/utils";

/** A small switch that flips an "active" flag via a server action. */
export function ToggleActive({
  id,
  active,
  action,
}: {
  id: string;
  active: boolean;
  action: (id: string, next: boolean) => Promise<ActionState>;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await action(id, !active);
          if (res?.error) toast.error(res.error);
        })
      }
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50",
        active ? "bg-success" : "bg-bg-elevated border border-border",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 size-5 rounded-full bg-white transition-transform",
          active ? "translate-x-[1.375rem]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

export function DeleteRow({
  id,
  action,
  confirmLabel = "Delete this item?",
}: {
  id: string;
  action: (id: string) => Promise<ActionState>;
  confirmLabel?: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm(confirmLabel)) return;
        start(async () => {
          const res = await action(id);
          if (res?.error) toast.error(res.error);
          else toast.success("Deleted");
        });
      }}
      className="flex size-8 items-center justify-center rounded-lg text-content-secondary transition-colors hover:bg-danger/15 hover:text-danger disabled:opacity-50"
      aria-label="Delete"
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
    </button>
  );
}

export function ResetPassword({
  email,
  action,
}: {
  email: string;
  action: (email: string) => Promise<ActionState>;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await action(email);
          if (res?.error) toast.error(res.error);
          else toast.success(res?.message ?? "Reset email sent");
        })
      }
      className="flex size-8 items-center justify-center rounded-lg text-content-secondary transition-colors hover:bg-bg-elevated hover:text-warm disabled:opacity-50"
      aria-label="Send password reset"
      title="Send password reset email"
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
    </button>
  );
}

import { useState } from "react";
import { updateStaffBiometrics } from "@/app/(app)/settings/actions";

export function BiometricMappingForm({
  profileId,
  initialPin,
  initialName,
}: {
  profileId: string;
  initialPin: string;
  initialName: string;
}) {
  const [pin, setPin] = useState(initialPin);
  const [name, setName] = useState(initialName);
  const [pending, start] = useTransition();

  const handleSave = () => {
    start(async () => {
      const res = await updateStaffBiometrics(profileId, pin, name);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(res?.message ?? "Saved successfully");
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl bg-bg-elevated/50 p-2 border border-border/40">
      <div className="flex items-center gap-1.5 min-w-[100px] flex-1">
        <label className="text-[10px] uppercase font-bold text-content-secondary">PIN:</label>
        <input
          type="text"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Biometric PIN"
          disabled={pending}
          className="h-7 w-full rounded-md border border-border bg-bg-card px-2 text-xs font-mono text-content-primary focus:border-border-strong focus:outline-none"
        />
      </div>
      <div className="flex items-center gap-1.5 min-w-[140px] flex-[2]">
        <label className="text-[10px] uppercase font-bold text-content-secondary">Bio Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Aditya K"
          disabled={pending}
          className="h-7 w-full rounded-md border border-border bg-bg-card px-2 text-xs text-content-primary focus:border-border-strong focus:outline-none"
        />
      </div>
      <button
        type="button"
        disabled={pending || (pin === initialPin && name === initialName)}
        onClick={handleSave}
        className="h-7 rounded-md bg-white text-black px-3 text-xs font-semibold hover:bg-white/90 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97] transition-all"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
