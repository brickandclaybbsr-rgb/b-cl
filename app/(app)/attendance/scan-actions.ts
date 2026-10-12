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
/**
 * Most a poor fix may widen a geofence by. Beyond this the reading is too
 * vague to prove presence, however honestly it was reported.
 */
const GEOFENCE_ACCURACY_CAP_M = 250;

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
  /**
   * Set when the scan would check the user OUT. The UI asks them to confirm
   * first, then re-scans with confirmCheckout — a second scan should never
   * silently end someone's shift.
   */
  needsCheckoutConfirm?: boolean;
  /** The token to replay when confirming the check-out. */
  token?: string;
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
  coords?: { latitude: number; longitude: number; accuracy?: number },
  opts?: { confirmCheckout?: boolean },
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
      return handleAttendanceScan(qr, coords, opts);

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
  coords?: { latitude: number; longitude: number; accuracy?: number },
  opts?: { confirmCheckout?: boolean },
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

  // Attendance may be marked at ANY active outlet, not just the assigned one.
  // Staff are assigned an outlet, but cover across sites often enough that
  // enforcing it here just locked people out of marking a shift they actually
  // worked — and the owner then had to enter the day by hand.
  //
  // profiles.outlet_id stays as the employee's home outlet for reporting; the
  // geofence below is the real control, since it requires physically standing
  // at whichever outlet the QR belongs to. A day may also start at one outlet
  // and end at another: check-out is matched on (profile, date), so scanning
  // out at the other site works and the row keeps the outlet they started at.

  const distance = haversineMeters(coords.latitude, coords.longitude, outlet.latitude, outlet.longitude);

  // Allow for how good the fix actually is. The QR is scanned indoors, so the
  // device often reports a wifi/cell position tens to hundreds of metres out —
  // an honest reading of "somewhere near here", not someone marking attendance
  // from home. Judging that against the bare radius rejected people standing at
  // the counter. The allowance is capped so a wildly uncertain fix still can't
  // wave through a scan from across town.
  const reported = Number.isFinite(coords.accuracy as number) ? Math.max(0, coords.accuracy as number) : 0;
  const allowance = outlet.radius_m + Math.min(reported, GEOFENCE_ACCURACY_CAP_M);

  if (distance > allowance) {
    return {
      error: reported > outlet.radius_m
        ? `Your location is only accurate to about ${Math.round(reported)}m right now, and reads ${Math.round(distance)}m from ${outlet.name}. Step outside or near a window for a moment and scan again.`
        : `You appear to be ${Math.round(distance)}m from ${outlet.name}. Move within ${outlet.radius_m}m of the outlet to mark attendance.`,
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

    // Never end a shift on a stray second scan — ask first.
    if (!opts?.confirmCheckout) {
      return {
        ok: true,
        qrType: "attendance",
        needsCheckoutConfirm: true,
        token: qr.token,
        title: "Check out?",
        details: [
          `You checked in at ${timeLabel(existing.checked_in_at)}`,
          outlet.name,
          "Only confirm if your shift has ended.",
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
