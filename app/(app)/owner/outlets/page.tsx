import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import QRCode from "qrcode";
import { requireOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Outlet, QrCode as QrCodeRow } from "@/lib/database.types";
import { OutletsClient } from "./outlets-client";
import { QrCodesClient } from "./qr-codes-client";

export const metadata = { title: "Outlets & QR Attendance" };

export default async function OutletsPage() {
  await requireOwner();
  const supabase = createClient();

  let outlets: Outlet[] = [];
  try {
    const { data } = await supabase
      .from("outlets")
      .select("*")
      .order("created_at", { ascending: true });
    outlets = data ?? [];
  } catch {
    outlets = [];
  }

  // Pre-render each outlet's QR as a data URL for display / printing.
  const qrMap: Record<string, string> = {};
  for (const o of outlets) {
    try {
      qrMap[o.id] = await QRCode.toDataURL(o.qr_token, {
        width: 480,
        margin: 2,
        errorCorrectionLevel: "M",
      });
    } catch {
      qrMap[o.id] = "";
    }
  }

  // Non-attendance QR codes (review/training/survey/task/...) managed from
  // the admin panel. Attendance QRs are managed via the outlet cards above.
  let otherQrCodes: QrCodeRow[] = [];
  try {
    const { data } = await supabase
      .from("qr_codes")
      .select("*")
      .neq("qr_type", "attendance")
      .order("created_at", { ascending: false });
    otherQrCodes = data ?? [];
  } catch {
    otherQrCodes = [];
  }

  const otherQrMap: Record<string, string> = {};
  for (const q of otherQrCodes) {
    try {
      otherQrMap[q.id] = await QRCode.toDataURL(q.token, { width: 480, margin: 2, errorCorrectionLevel: "M" });
    } catch {
      otherQrMap[q.id] = "";
    }
  }

  return (
    <div className="container mx-auto max-w-3xl space-y-5 pb-16">
      <div className="flex items-center gap-3 pt-1">
        <Link
          href="/owner"
          className="rounded-lg p-1.5 text-content-secondary transition-colors hover:bg-bg-elevated hover:text-content-primary"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-content-primary">Outlets &amp; QR Attendance</h1>
          <p className="text-xs text-content-secondary">
            Manage restaurant locations, geofences, and printable check-in QR codes.
          </p>
        </div>
      </div>

      <OutletsClient initialOutlets={outlets} qrMap={qrMap} />

      <div className="pt-4 border-t border-border/40">
        <h2 className="text-sm font-bold text-content-primary mb-1">Other QR Codes</h2>
        <p className="text-xs text-content-secondary mb-3">
          Create QR codes for future workflows (staff review, training, survey, task…). The scanner
          automatically recognises the type once scanned — no app update needed to add a new one.
        </p>
        <QrCodesClient
          initialQrCodes={otherQrCodes}
          qrMap={otherQrMap}
          outlets={outlets.map((o) => ({ id: o.id, name: o.name }))}
        />
      </div>
    </div>
  );
}
