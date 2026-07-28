"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { todayIST } from "@/lib/date";
import { haversineMeters } from "@/lib/geo";

/**
 * Result of scanning any Brick & Clay QR code.
 *
 * `redirectTo` lets a workflow send the user somewhere after a successful scan
 * (e.g. attendance → the role-based opening checklist).
 */
export type ScanResult = {
  ok?: boolean;
  error?: string;
  /** Which workflow ran, e.g. "attendance". */
  qrType?: string;
  /** Headline shown to the user, e.g. "Attendance marked". */
  title?: string;
  /** Supporting lines (date, time, outlet…). */
  details?: string[];
  /** Where to send the user next. */
  redirectTo?: string;
};

/**
 * THE universal scan entry point.
 *
 * Resolves a scanned token against the qr_codes registry and dispatches to the
 * matching workflow. Adding a new QR workflow means adding a row in qr_codes
 * and a case in the switch below — the scanner UI never changes.
 */
export async function handleScan(
  token: string,
  coords?: { latitude: number; longitude: number },
): Promise<ScanResult> {
  const cleaned = token.trim();
  if (!cleaned) return { error: "No QR code detected. Please try again." };

  const supabase = createClient();

  const { data: qr } = await supabase
    .from("qr_codes")
    .select("*")
    .eq("token", cleaned)
    .eq("is_active", true)
    .maybeSingle();

  if (!qr) {
    return { error: "Unrecognized QR code. Please scan an official Brick & Clay QR." };
  }

  if (qr.expires_at && new Date(qr.expires_at).getTime() < Date.now()) {
    return { error: `This ${qr.qr_type} QR code has expired. Ask the manager for a new one.` };
  }

  switch (qr.qr_type) {
    case "attendance":
      return handleAttendanceScan(qr, coords);

    // Future workflows are added here. Until then, a recognised-but-unhandled
    // QR gives a clear message rather than a silent failure.
    default:
      return {
        error: `"${qr.label}" (${qr.qr_type}) isn't available yet. This QR type is registered but its workflow is not enabled.`,
      };
  }
}

/**
 * Attendance workflow: validate outlet assignment + geofence, then mark today's
 * check-in (or check-out if already checked in).
 */
async function handleAttendanceScan(
  qr: any,
  coords?: { latitude: number; longitude: number },
): Promise<ScanResult> {
  const profile = await requireProfile();
  const supabase = createClient();

  if (profile.is_house_helper) {
    return { error: "House helpers don't use QR attendance. Speak to your manager." };
  }

  if (!coords || !Number.isFinite(coords.latitude) || !Number.isFinite(coords.longitude)) {
    return { error: "Location unavailable. Turn on location access and try again." };
  }

  if (!qr.outlet_id) {
    return { error: "This attendance QR isn't linked to an outlet. Ask the manager to re-generate it." };
  }

  const { data: outlet } = await supabase
    .from("outlets")
    .select("*")
    .eq("id", qr.outlet_id)
    .eq("is_active", true)
    .maybeSingle();

  if (!outlet) return { error: "This outlet is no longer active." };

  // Employees may only mark attendance at their assigned outlet. Unassigned
  // employees (outlet_id null) may use any outlet.
  if (profile.outlet_id && profile.outlet_id !== outlet.id) {
    return { error: `You must be within your assigned outlet to mark attendance. This QR belongs to ${outlet.name}.` };
  }

  const distance = haversineMeters(coords.latitude, coords.longitude, outlet.latitude, outlet.longitude);
  if (distance > outlet.radius_m) {
    return {
      error: `You appear to be ${Math.round(distance)}m from ${outlet.name}. Move within ${outlet.radius_m}m of the outlet to mark attendance.`,
    };
  }

  const date = todayIST();
  const now = new Date().toISOString();
  const roundedDistance = Math.round(distance * 100) / 100;

  const { data: existing } = await supabase
    .from("attendance_checkins")
    .select("*")
    .eq("profile_id", profile.id)
    .eq("date", date)
    .maybeSingle();

  const timeLabel = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-IN", {
      hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata",
    });
  const dateLabel = new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });

  // Already checked in → this scan is the check-out.
  if (existing) {
    if (existing.checked_out_at) {
      return {
        ok: true,
        qrType: "attendance",
        title: "Already completed for today",
        details: [
          dateLabel,
          `In ${timeLabel(existing.checked_in_at)} · Out ${timeLabel(existing.checked_out_at)}`,
          outlet.name,
        ],
      };
    }

    const { error } = await supabase
      .from("attendance_checkins")
      .update({
        checked_out_at: now,
        checkout_latitude: coords.latitude,
        checkout_longitude: coords.longitude,
        checkout_distance_m: roundedDistance,
      })
      .eq("id", existing.id);

    if (error) return { error: error.message };

    revalidatePath("/", "layout");
    return {
      ok: true,
      qrType: "attendance",
      title: "Checked out",
      details: [dateLabel, `In ${timeLabel(existing.checked_in_at)} · Out ${timeLabel(now)}`, outlet.name],
      redirectTo: "/dashboard",
    };
  }

  // First scan of the day → check in.
  const { error } = await supabase.from("attendance_checkins").insert({
    profile_id: profile.id,
    outlet_id: outlet.id,
    date,
    checked_in_at: now,
    latitude: coords.latitude,
    longitude: coords.longitude,
    distance_m: roundedDistance,
  });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");

  return {
    ok: true,
    qrType: "attendance",
    title: "Attendance marked",
    details: [dateLabel, timeLabel(now), outlet.name],
    // Send them straight into their opening checklist (skipped automatically
    // by the checklist page if today's is already submitted).
    redirectTo: await openingChecklistRoute(supabase, profile, date),
  };
}

/**
 * Where to send an employee after checking in: their role's opening checklist,
 * or the dashboard if today's checklist is already submitted.
 */
async function openingChecklistRoute(
  supabase: any,
  profile: { id: string; team?: string | null },
  date: string,
): Promise<string> {
  // head_chef shares the kitchen checklist record (matches checklist actions).
  const team =
    profile.team === "head_chef" ? "kitchen" :
    profile.team === "front_desk" ? "front_desk" :
    profile.team === "kitchen" ? "kitchen" : null;

  if (!team) return "/dashboard";

  try {
    const { data: submitted } = await supabase
      .from("opening_checklists")
      .select("id")
      .eq("date", date)
      .eq("team", team)
      .maybeSingle();

    return submitted ? "/dashboard" : "/checklist/opening";
  } catch {
    return "/dashboard";
  }
}
