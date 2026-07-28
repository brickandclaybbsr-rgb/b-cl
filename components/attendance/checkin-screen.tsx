"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { toast } from "sonner";
import { QrCode, MapPin, Loader2, CheckCircle2, AlertCircle, Camera } from "lucide-react";
import { handleScan } from "@/app/(app)/attendance/scan-actions";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";

type Phase = "start" | "scanning" | "processing" | "success";

const QR_REGION_ID = "qr-reader-region";

export function CheckInScreen({ name, redirectTo, embedded }: { name: string; redirectTo?: string; embedded?: boolean }) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const busyRef = useRef(false);
  const [phase, setPhase] = useState<Phase>("start");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resultTitle, setResultTitle] = useState("");
  const [resultDetails, setResultDetails] = useState<string[]>([]);

  const stopScan = async () => {
    const s = scannerRef.current;
    if (s) {
      try {
        await s.stop();
        await s.clear();
      } catch {
        /* already stopped */
      }
      scannerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      void stopScan();
    };
  }, []);

  const startScan = async () => {
    setError("");
    setMessage("");
    setPhase("scanning");
    // Wait a tick so the scanner region is mounted.
    await new Promise((r) => setTimeout(r, 50));
    try {
      const scanner = new Html5Qrcode(QR_REGION_ID);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decoded) => {
          void handleDecoded(decoded);
        },
        () => {
          /* per-frame decode failures are normal — ignore */
        },
      );
    } catch (e) {
      setPhase("start");
      setError("Could not open the camera. Please allow camera access and try again.");
    }
  };

  const handleDecoded = async (token: string) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setPhase("processing");
    setMessage("QR scanned — confirming your location…");
    await stopScan();

    if (!("geolocation" in navigator)) {
      setError("This device can't share its location, which is required to check in.");
      setPhase("start");
      busyRef.current = false;
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await handleScan(token, {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          if (res.ok) {
            setResultTitle(res.title || "Done");
            setResultDetails(res.details || []);
            setPhase("success");
            toast.success(res.title || "Done");
            const target = res.redirectTo ?? redirectTo;
            setTimeout(() => {
              if (target) window.location.assign(target);
              else window.location.reload();
            }, 1400);
          } else {
            setError(res.error || "Scan failed. Please try again.");
            setPhase("start");
            busyRef.current = false;
          }
        } catch {
          setError("Something went wrong. Please try again.");
          setPhase("start");
          busyRef.current = false;
        }
      },
      () => {
        setError("Location access is required to mark attendance. Enable location and try again.");
        setPhase("start");
        busyRef.current = false;
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center px-5",
      embedded ? "min-h-[70dvh] py-4" : "min-h-[100dvh] bg-bg-base py-8",
    )}>
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          {!embedded && <BrandLogo height={40} />}
          <div>
            <h1 className="text-lg font-bold text-content-primary">Mark your attendance</h1>
            <p className="mt-1 text-sm text-content-secondary">
              Hi {name.split(" ")[0]} — scan the outlet QR code from inside the restaurant to start your day.
            </p>
          </div>
        </div>

        {/* Scanner / status card */}
        <div className="rounded-2xl border border-border bg-bg-elevated/40 p-4">
          {phase === "start" && (
            <div className="space-y-4">
              <div className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-border/70 bg-black/20">
                <QrCode className="size-20 text-content-secondary/40" />
              </div>
              <button
                type="button"
                onClick={startScan}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-black transition-opacity hover:opacity-90"
              >
                <Camera className="size-4" /> Scan QR
              </button>
            </div>
          )}

          {phase === "scanning" && (
            <div className="space-y-3">
              <div id={QR_REGION_ID} className="overflow-hidden rounded-xl [&_video]:rounded-xl" />
              <p className="flex items-center justify-center gap-1.5 text-center text-xs text-content-secondary">
                <QrCode className="size-3.5" /> Point your camera at the outlet QR code
              </p>
              <button
                type="button"
                onClick={async () => {
                  await stopScan();
                  setPhase("start");
                }}
                className="w-full rounded-xl border border-border py-2 text-xs font-semibold text-content-secondary"
              >
                Cancel
              </button>
            </div>
          )}

          {phase === "processing" && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <Loader2 className="size-8 animate-spin text-fire" />
              <p className="flex items-center gap-1.5 text-sm text-content-secondary">
                <MapPin className="size-4" /> {message}
              </p>
            </div>
          )}

          {phase === "success" && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <CheckCircle2 className="size-12 text-green-400" />
              <div>
                <p className="text-base font-bold text-content-primary">{resultTitle}</p>
                {resultDetails.map((line) => (
                  <p key={line} className="mt-0.5 text-sm text-content-secondary">{line}</p>
                ))}
                <p className="mt-2 text-xs text-content-secondary">Taking you to the next step…</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2.5 text-xs text-danger">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <p className="text-center text-[11px] leading-relaxed text-content-secondary/70">
          You must be physically present at the outlet to check in.
          {!embedded && " Attendance is required before you can use the app for the day."}
        </p>

        {!embedded && (
          <div className="flex justify-center pt-1">
            <SignOutButton />
          </div>
        )}
      </div>
    </div>
  );
}
