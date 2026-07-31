"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MapPin, Trash2, Pencil, Plus, Printer, LocateFixed, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Outlet } from "@/lib/database.types";
import { getCurrentCoords } from "@/lib/native";
import { saveOutlet, deleteOutlet, type OutletActionState } from "@/app/(app)/attendance/checkin-actions";

export function OutletsClient({
  initialOutlets,
  qrMap,
}: {
  initialOutlets: Outlet[];
  qrMap: Record<string, string>;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Outlet | null>(null);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-5">
      {!showForm && (
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm font-semibold text-content-secondary transition-colors hover:border-fire/50 hover:text-fire"
        >
          <Plus className="size-4" /> Add outlet
        </button>
      )}

      {showForm && (
        <OutletForm
          outlet={editing}
          onDone={() => {
            setShowForm(false);
            setEditing(null);
            router.refresh();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      {initialOutlets.length === 0 && !showForm && (
        <Card className="p-6 text-center text-sm text-content-secondary">
          No outlets yet. Add your first restaurant location to enable QR attendance.
        </Card>
      )}

      <div className="space-y-4">
        {initialOutlets.map((o) => (
          <OutletCard
            key={o.id}
            outlet={o}
            qr={qrMap[o.id] ?? ""}
            onEdit={() => {
              setEditing(o);
              setShowForm(true);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        ))}
      </div>
    </div>
  );
}

function OutletForm({
  outlet,
  onDone,
  onCancel,
}: {
  outlet: Outlet | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [state, formAction] = useFormState<OutletActionState, FormData>(saveOutlet, {});
  const [lat, setLat] = useState(outlet ? String(outlet.latitude) : "");
  const [lng, setLng] = useState(outlet ? String(outlet.longitude) : "");
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.ok) {
      toast.success(state.message || "Saved");
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const useMyLocation = async () => {
    setLocating(true);
    try {
      // Uses the Capacitor plugin inside the app shell so Android prompts for
      // the runtime location permission; browser API on the web.
      const coords = await getCurrentCoords();
      setLat(coords.latitude.toFixed(6));
      setLng(coords.longitude.toFixed(6));
      toast.success("Location captured");
    } catch (err: any) {
      toast.error(err?.message || "Could not get your location. Enable location access.");
    } finally {
      setLocating(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-content-primary">
          {outlet ? "Edit outlet" : "New outlet"}
        </h3>
        <button type="button" onClick={onCancel} className="text-content-secondary hover:text-content-primary">
          <X className="size-4" />
        </button>
      </div>

      <form action={formAction} className="space-y-3">
        {outlet && <input type="hidden" name="id" value={outlet.id} />}

        <div className="space-y-1.5">
          <Label htmlFor="outlet-name">Outlet name</Label>
          <Input id="outlet-name" name="name" required defaultValue={outlet?.name ?? ""} placeholder="Brick & Clay — Main" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="outlet-lat">Latitude</Label>
            <Input id="outlet-lat" name="latitude" required value={lat} onChange={(e) => setLat(e.target.value)} placeholder="20.2961" inputMode="decimal" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="outlet-lng">Longitude</Label>
            <Input id="outlet-lng" name="longitude" required value={lng} onChange={(e) => setLng(e.target.value)} placeholder="85.8245" inputMode="decimal" />
          </div>
        </div>

        <button
          type="button"
          onClick={useMyLocation}
          className="flex items-center gap-1.5 text-xs font-semibold text-fire hover:underline disabled:opacity-60"
          disabled={locating}
        >
          <LocateFixed className="size-3.5" /> {locating ? "Getting location…" : "Use my current location"}
        </button>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="outlet-radius">Geofence radius (m)</Label>
            <Input id="outlet-radius" name="radius_m" type="number" min="10" step="10" defaultValue={outlet?.radius_m ?? 150} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="outlet-active">Status</Label>
            <select
              id="outlet-active"
              name="is_active"
              defaultValue={outlet ? String(outlet.is_active) : "true"}
              className="h-10 w-full rounded-lg border border-border bg-bg-elevated px-3 text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-fire/40"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onCancel} className="flex-1 rounded-lg border border-border py-2 text-sm font-semibold text-content-secondary">
            Cancel
          </button>
          <SubmitButton className="flex-1" pendingText="Saving…">
            {outlet ? "Save changes" : "Add outlet"}
          </SubmitButton>
        </div>
      </form>
    </Card>
  );
}

function OutletCard({ outlet, qr, onEdit }: { outlet: Outlet; qr: string; onEdit: () => void }) {
  const router = useRouter();
  const [delState, delAction] = useFormState<OutletActionState, FormData>(deleteOutlet, {});
  const [confirming, setConfirming] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (delState.error) toast.error(delState.error);
    if (delState.ok) {
      toast.success("Outlet deleted");
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delState]);

  const printQr = () => {
    if (!qr) return;
    const w = window.open("", "_blank", "width=600,height=800");
    if (!w) return;
    w.document.write(`
      <html><head><title>${outlet.name} — Check-in QR</title>
      <style>
        body{font-family:system-ui,sans-serif;text-align:center;padding:40px;color:#111;}
        h1{font-size:22px;margin:0 0 4px;} p{color:#555;margin:0 0 24px;font-size:14px;}
        img{width:340px;height:340px;} .foot{margin-top:24px;font-size:13px;color:#666;}
      </style></head>
      <body>
        <h1>${outlet.name}</h1>
        <p>Scan to mark attendance · Brick &amp; Clay</p>
        <img src="${qr}" alt="QR" />
        <div class="foot">Scan this code in the Brick &amp; Clay app to check in.</div>
        <script>window.onload=()=>{window.print();}</script>
      </body></html>`);
    w.document.close();
  };

  return (
    <Card className="p-4">
      <div className="flex gap-4">
        <div ref={printRef} className="shrink-0">
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt={`${outlet.name} QR`} className="size-24 rounded-lg bg-white p-1.5" />
          ) : (
            <div className="flex size-24 items-center justify-center rounded-lg border border-border text-[10px] text-content-secondary">
              No QR
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-bold text-content-primary">{outlet.name}</p>
            {!outlet.is_active && (
              <span className="rounded-full bg-content-secondary/15 px-2 py-0.5 text-[10px] font-semibold text-content-secondary">
                Inactive
              </span>
            )}
          </div>
          <p className="mt-1 flex items-center gap-1 text-xs text-content-secondary">
            <MapPin className="size-3" /> {outlet.latitude.toFixed(5)}, {outlet.longitude.toFixed(5)}
          </p>
          <p className="mt-0.5 text-xs text-content-secondary">Geofence: {outlet.radius_m} m radius</p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={printQr}
              className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-content-primary transition-colors hover:bg-bg-elevated"
            >
              <Printer className="size-3.5" /> Print QR
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-content-secondary transition-colors hover:bg-bg-elevated hover:text-content-primary"
            >
              <Pencil className="size-3.5" /> Edit
            </button>
            {!confirming ? (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-content-secondary transition-colors hover:bg-danger/10 hover:text-danger"
              >
                <Trash2 className="size-3.5" /> Delete
              </button>
            ) : (
              <form action={delAction} className="flex items-center gap-2">
                <input type="hidden" name="id" value={outlet.id} />
                <button type="submit" className="rounded-lg bg-danger px-2.5 py-1.5 text-xs font-bold text-white">
                  Confirm delete
                </button>
                <button type="button" onClick={() => setConfirming(false)} className="text-xs text-content-secondary">
                  Cancel
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
