"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

/** Owner-only manual trigger for the EOD WhatsApp report. */
export function SendReportButton(props: ButtonProps) {
  const [loading, setLoading] = useState(false);

  async function send() {
    setLoading(true);
    try {
      const res = await fetch("/api/send-eod-report", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(json.message ?? "Report sent ✓");
      } else {
        toast.error(json.error ?? "Could not send the report.");
      }
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={send} disabled={loading} {...props}>
      {loading ? <Loader2 className="animate-spin" /> : <Send className="size-4" />}
      {loading ? "Sending…" : "Send EOD report"}
    </Button>
  );
}
