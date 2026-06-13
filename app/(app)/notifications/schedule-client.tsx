"use client";

import { useEffect } from "react";
import { useFormState } from "react-dom";
import { toast } from "sonner";
import { Clock, Play, ToggleLeft, ToggleRight } from "lucide-react";
import { toggleNotificationSetting, triggerManualNotification, type NotifyState } from "./actions";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";

interface ScheduleGroup {
  key: string;
  title: string;
  description: string;
  rounds: { label: string; time: string }[];
  triggerType: string;
  enabled: boolean;
}

function ToggleForm({ groupKey, enabled }: { groupKey: string; enabled: boolean }) {
  const [state, action] = useFormState<NotifyState, FormData>(toggleNotificationSetting, {});
  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.ok) toast.success(enabled ? "Notifications disabled" : "Notifications enabled");
  }, [state]);

  return (
    <form action={action}>
      <input type="hidden" name="key" value={groupKey} />
      <input type="hidden" name="value" value={enabled ? "false" : "true"} />
      <button
        type="submit"
        className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
        title={enabled ? "Disable" : "Enable"}
      >
        {enabled ? (
          <ToggleRight className="size-5 text-success" />
        ) : (
          <ToggleLeft className="size-5 text-content-secondary" />
        )}
        <span className={enabled ? "text-success" : "text-content-secondary"}>
          {enabled ? "On" : "Off"}
        </span>
      </button>
    </form>
  );
}

function TriggerForm({ triggerType, label }: { triggerType: string; label: string }) {
  const [state, action] = useFormState<NotifyState, FormData>(triggerManualNotification, {});
  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.ok) toast.success(`${label} sent!`);
  }, [state]);

  return (
    <form action={action}>
      <input type="hidden" name="type" value={triggerType} />
      <SubmitButton
        size="sm"
        variant="secondary"
        pendingText="Sending…"
        className="flex items-center gap-1.5 text-xs"
      >
        <Play className="size-3" /> Send now
      </SubmitButton>
    </form>
  );
}

export function ScheduleClient({ groups }: { groups: ScheduleGroup[] }) {
  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <Card key={group.key} className="overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-border p-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-content-primary">{group.title}</p>
              <p className="mt-0.5 text-xs text-content-secondary">{group.description}</p>
            </div>
            <ToggleForm groupKey={group.key} enabled={group.enabled} />
          </div>

          {/* Round timings */}
          <div className="divide-y divide-border/50">
            {group.rounds.map((round) => (
              <div key={round.label} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-2 text-sm text-content-secondary">
                  <Clock className="size-3.5 shrink-0" />
                  <span>{round.label}</span>
                </div>
                <span className="font-mono text-sm font-semibold tabular-nums text-content-primary">
                  {round.time} IST
                </span>
              </div>
            ))}
          </div>

          {/* Manual trigger */}
          <div className="flex items-center justify-between border-t border-border bg-bg-elevated/50 px-4 py-2.5">
            <span className="text-xs text-content-secondary">Trigger manually</span>
            <TriggerForm triggerType={group.triggerType} label={group.title} />
          </div>
        </Card>
      ))}
    </div>
  );
}
