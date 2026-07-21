import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import QRCode from "qrcode";
import { requireOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Outlet } from "@/lib/database.types";
import { OutletsClient } from "./outlets-client";

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
    </div>
  );
}
