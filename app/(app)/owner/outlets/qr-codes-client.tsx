"use client";

import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Printer, X, Power } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import type { QrCode } from "@/lib/database.types";
import { createQrCode, deleteQrCode, setQrCodeActive, type OutletActionState } from "@/app/(app)/attendance/checkin-actions";

const QR_TYPES = [
  { value: "review", label: "Staff Review" },
  { value: "training", label: "Training" },
  { value: "survey", label: "Survey / Feedback" },
  { value: "task", label: "Task" },
];

export function QrCodesClient({
  initialQrCodes,
  qrMap,
  outlets,
}: {
  initialQrCodes: QrCode[];
  qrMap: Record<string, string>;
  outlets: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [state, formAction] = useFormState<OutletActionState, FormData>(createQrCode, {});

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.ok) {
      toast.success(state.message || "QR code created");
      setShowForm(false);
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="space-y-4">
      {!showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm font-semibold text-content-secondary transition-colors hover:border-fire/50 hover:text-fire"
        >
          <Plus className="size-4" /> Create QR code
        </button>
      )}

      {showForm && (
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-content-primary">New QR code</h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-content-secondary hover:text-content-primary">
              <X className="size-4" />
            </button>
          </div>
          <form action={formAction} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="qr-label">Label</Label>
              <Input id="qr-label" name="label" required placeholder="e.g. June performance review" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="qr-type">Type</Label>
                <Select id="qr-type" name="qr_type" required defaultValue="">
                  <option value="" disabled>Select type</option>
                  {QR_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="qr-outlet">Outlet (optional)</Label>
                <Select id="qr-outlet" name="outlet_id" defaultValue="">
                  <option value="">Not outlet-specific</option>
                  {outlets.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qr-expires">Expires (optional)</Label>
              <Input id="qr-expires" name="expires_at" type="date" style={{ colorScheme: "dark" }} />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 rounded-lg border border-border py-2 text-sm font-semibold text-content-secondary">
                Cancel
              </button>
              <SubmitButton className="flex-1" pendingText="Creating…">Create QR code</SubmitButton>
            </div>
          </form>
        </Card>
      )}

      {initialQrCodes.length === 0 && !showForm && (
        <Card className="p-6 text-center text-sm text-content-secondary">
          No other QR codes yet.
        </Card>
      )}

      <div className="space-y-3">
        {initialQrCodes.map((qr) => (
          <QrCodeCard key={qr.id} qr={qr} qrImage={qrMap[qr.id] ?? ""} />
        ))}
      </div>
    </div>
  );
}

function QrCodeCard({ qr, qrImage }: { qr: QrCode; qrImage: string }) {
  const router = useRouter();
  const [delState, delAction] = useFormState<OutletActionState, FormData>(deleteQrCode, {});
  const [confirming, setConfirming] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (delState.error) toast.error(delState.error);
    if (delState.ok) {
      toast.success("QR code deleted");
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delState]);

  const printQr = () => {
    if (!qrImage) return;
    const w = window.open("", "_blank", "width=600,height=800");
    if (!w) return;
    w.document.write(`
      <html><head><title>${qr.label}</title>
      <style>body{font-family:system-ui,sans-serif;text-align:center;padding:40px;color:#111;}
      h1{font-size:22px;margin:0 0 4px;} p{color:#555;margin:0 0 24px;font-size:14px;}
      img{width:340px;height:340px;}</style></head>
      <body><h1>${qr.label}</h1><p>Scan with the Brick &amp; Clay app</p>
      <img src="${qrImage}" alt="QR" /><script>window.onload=()=>{window.print();}</script></body></html>`);
    w.document.close();
  };

  return (
    <Card className="p-4">
      <div className="flex gap-4">
        {qrImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrImage} alt={qr.label} className="size-20 shrink-0 rounded-lg bg-white p-1.5" />
        ) : (
          <div className="flex size-20 shrink-0 items-center justify-center rounded-lg border border-border text-[10px] text-content-secondary">No QR</div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-bold text-content-primary">{qr.label}</p>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-content-secondary">{qr.qr_type}</span>
            {!qr.is_active && (
              <span className="rounded-full bg-content-secondary/15 px-2 py-0.5 text-[10px] font-semibold text-content-secondary">Inactive</span>
            )}
          </div>
          {qr.expires_at && (
            <p className="mt-1 text-xs text-content-secondary">
              Expires {new Date(qr.expires_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={printQr} className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-content-primary transition-colors hover:bg-bg-elevated">
              <Printer className="size-3.5" /> Print QR
            </button>
            <button
              type="button"
              disabled={toggling}
              onClick={async () => {
                setToggling(true);
                const res = await setQrCodeActive(qr.id, !qr.is_active);
                setToggling(false);
                if (res.error) toast.error(res.error);
                else { toast.success(qr.is_active ? "Deactivated" : "Activated"); router.refresh(); }
              }}
              className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-content-secondary transition-colors hover:bg-bg-elevated hover:text-content-primary"
            >
              <Power className="size-3.5" /> {qr.is_active ? "Deactivate" : "Activate"}
            </button>
            {!confirming ? (
              <button type="button" onClick={() => setConfirming(true)} className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-content-secondary transition-colors hover:bg-danger/10 hover:text-danger">
                <Trash2 className="size-3.5" /> Delete
              </button>
            ) : (
              <form action={delAction} className="flex items-center gap-2">
                <input type="hidden" name="id" value={qr.id} />
                <button type="submit" className="rounded-lg bg-danger px-2.5 py-1.5 text-xs font-bold text-white">Confirm delete</button>
                <button type="button" onClick={() => setConfirming(false)} className="text-xs text-content-secondary">Cancel</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
