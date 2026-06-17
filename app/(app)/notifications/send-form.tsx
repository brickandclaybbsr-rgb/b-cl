"use client";

import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { toast } from "sonner";
import { Bell, Users, User, Globe } from "lucide-react";
import { sendCustomNotification, type NotifyState } from "./actions";
import { Card } from "@/components/ui/card";
import { Confetti } from "@/components/ui/confetti";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";

const TARGETS = [
  { value: "staff", label: "All Staff", description: "Every staff member", icon: Users },
  { value: "everyone", label: "Everyone", description: "Staff + owner", icon: Globe },
  { value: "owner", label: "Owner only", description: "Just you", icon: User },
];

export function SendNotificationForm() {
  const [state, formAction] = useFormState<NotifyState, FormData>(
    sendCustomNotification,
    {},
  );
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.ok) {
      toast.success("Notification sent!");
      setShowConfetti(true);
    }
  }, [state]);

  return (
    <>
    <Confetti active={showConfetti} />
    <form action={formAction} className="space-y-4">
      <Card className="space-y-4 p-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-warm">
          Recipient
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {TARGETS.map((t, i) => {
            const Icon = t.icon;
            return (
              <label key={t.value} className="cursor-pointer">
                <input
                  type="radio"
                  name="target"
                  value={t.value}
                  defaultChecked={i === 0}
                  className="peer sr-only"
                />
                <div className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border border-border p-3 text-center transition-all duration-150",
                  "peer-checked:border-white/40 peer-checked:bg-white/[0.07] peer-checked:text-white",
                  "text-content-secondary hover:border-border-strong hover:text-content-primary",
                )}>
                  <Icon className="size-4" />
                  <span className="text-xs font-semibold">{t.label}</span>
                  <span className="text-[10px] text-content-secondary">{t.description}</span>
                </div>
              </label>
            );
          })}
        </div>
      </Card>

      <Card className="space-y-4 p-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-warm">
          Message
        </h2>
        <div className="space-y-1.5">
          <Label htmlFor="title" className="flex items-center gap-1.5">
            <Bell className="size-3.5" /> Title
          </Label>
          <Input
            id="title"
            name="title"
            placeholder="e.g. Shop closed today"
            maxLength={65}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="body">Message</Label>
          <Textarea
            id="body"
            name="body"
            placeholder="Type your message here…"
            rows={4}
            maxLength={300}
            required
          />
        </div>
      </Card>

      <SubmitButton className="w-full" size="lg" pendingText="Sending…">
        Send notification
      </SubmitButton>
    </form>
    </>
  );
}
