"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, requireOwner } from "@/lib/auth";
import { todayIST } from "@/lib/date";
import { haversineMeters } from "@/lib/geo";

export type CheckInState = {
  ok?: boolean;
  error?: string;
  outletName?: string;
  distance?: number;
};

/**
 * Record today's check-in for the current staff member.
 * Requires a valid outlet QR token AND being within the outlet's geofence.
 */
export async function checkIn(
  _prev: CheckInState,
  formData: FormData,
): Promise<CheckInState> {
  const profile = await requireProfile();

  const token = String(formData.get("qr_token") ?? "").trim();
  const lat = parseFloat(String(formData.get("latitude") ?? ""));
  const lng = parseFloat(String(formData.get("longitude") ?? ""));

  if (!token) return { error: "No QR code detected. Scan the outlet's QR code." };
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { error: "Location unavailable. Turn on location access and try again." };
  }

  const supabase = createClient();

  const { data: outlet } = await supabase
    .from("outlets")
    .select("*")
    .eq("qr_token", token)
    .eq("is_active", true)
    .maybeSingle();

  if (!outlet) {
    return { error: "Unrecognized QR code. Please scan the official outlet QR." };
  }

  const distance = haversineMeters(lat, lng, outlet.latitude, outlet.longitude);
  if (distance > outlet.radius_m) {
    return {
      error: `You appear to be ${Math.round(distance)}m away from ${outlet.name}. Move within ${outlet.radius_m}m of the outlet to check in.`,
    };
  }

  const { error } = await supabase.from("attendance_checkins").upsert(
    {
      profile_id: profile.id,
      outlet_id: outlet.id,
      date: todayIST(),
      checked_in_at: new Date().toISOString(),
      latitude: lat,
      longitude: lng,
      distance_m: Math.round(distance * 100) / 100,
    },
    { onConflict: "profile_id,date" },
  );

  if (error) return { error: error.message };

  // Refresh the whole app so the gate lets them through.
  revalidatePath("/", "layout");
  return { ok: true, outletName: outlet.name, distance: Math.round(distance) };
}

// ── Owner outlet management ────────────────────────────────────────────────────

export type OutletActionState = { ok?: boolean; error?: string; message?: string };

/** Create or update an outlet (owner only). */
export async function saveOutlet(
  _prev: OutletActionState,
  formData: FormData,
): Promise<OutletActionState> {
  try {
    await requireOwner();
    const supabase = createClient();

    const id = String(formData.get("id") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    const latitude = parseFloat(String(formData.get("latitude") ?? ""));
    const longitude = parseFloat(String(formData.get("longitude") ?? ""));
    const radiusRaw = String(formData.get("radius_m") ?? "").trim();
    const radius_m = radiusRaw ? parseInt(radiusRaw, 10) : 150;
    const is_active = String(formData.get("is_active") ?? "true") !== "false";

    if (!name) return { error: "Outlet name is required." };
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return { error: "Valid latitude and longitude are required." };
    }
    if (!Number.isFinite(radius_m) || radius_m <= 0) {
      return { error: "Radius must be a positive number of metres." };
    }

    if (id) {
      const { error } = await supabase
        .from("outlets")
        .update({ name, latitude, longitude, radius_m, is_active })
        .eq("id", id);
      if (error) return { error: error.message };
      revalidatePath("/owner/outlets");
      return { ok: true, message: `${name} updated.` };
    }

    const { error } = await supabase.from("outlets").insert({
      name,
      qr_token: randomUUID(),
      latitude,
      longitude,
      radius_m,
      is_active,
    });
    if (error) return { error: error.message };
    revalidatePath("/owner/outlets");
    return { ok: true, message: `${name} added.` };
  } catch (err: any) {
    console.error("saveOutlet exception:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}

// ── QR code registry management (owner only) ──────────────────────────────────

/**
 * Create a QR code of any type. New workflows are added as data here — the
 * universal scanner dispatches on qr_type without code changes.
 */
export async function createQrCode(
  _prev: OutletActionState,
  formData: FormData,
): Promise<OutletActionState> {
  try {
    await requireOwner();
    const supabase = createClient();

    const label = String(formData.get("label") ?? "").trim();
    const qrType = String(formData.get("qr_type") ?? "").trim();
    const action = String(formData.get("action") ?? "").trim();
    const outletId = String(formData.get("outlet_id") ?? "").trim();
    const expiresAt = String(formData.get("expires_at") ?? "").trim();

    if (!label) return { error: "A label is required so you can identify this QR." };
    if (!qrType) return { error: "Please choose a QR type." };
    if (qrType === "attendance" && !outletId) {
      return { error: "Attendance QR codes must be linked to an outlet." };
    }

    const { error } = await supabase.from("qr_codes").insert({
      token: randomUUID(),
      qr_type: qrType,
      label,
      action: action || null,
      outlet_id: outletId || null,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      is_active: true,
    });

    if (error) return { error: error.message };
    revalidatePath("/owner/outlets");
    return { ok: true, message: `${label} created.` };
  } catch (err: any) {
    console.error("createQrCode exception:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}

/** Activate / deactivate a QR code (owner only). */
export async function setQrCodeActive(
  qrId: string,
  isActive: boolean,
): Promise<OutletActionState> {
  try {
    await requireOwner();
    const supabase = createClient();
    const { error } = await supabase
      .from("qr_codes")
      .update({ is_active: isActive })
      .eq("id", qrId);
    if (error) return { error: error.message };
    revalidatePath("/owner/outlets");
    return { ok: true };
  } catch (err: any) {
    return { error: err.message || "An unexpected error occurred." };
  }
}

/** Delete a QR code (owner only). */
export async function deleteQrCode(
  _prev: OutletActionState,
  formData: FormData,
): Promise<OutletActionState> {
  try {
    await requireOwner();
    const supabase = createClient();
    const id = String(formData.get("id") ?? "").trim();
    if (!id) return { error: "Missing QR id." };
    const { error } = await supabase.from("qr_codes").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/owner/outlets");
    return { ok: true };
  } catch (err: any) {
    return { error: err.message || "An unexpected error occurred." };
  }
}

/** Delete an outlet (owner only). */
export async function deleteOutlet(
  _prev: OutletActionState,
  formData: FormData,
): Promise<OutletActionState> {
  try {
    await requireOwner();
    const supabase = createClient();
    const id = String(formData.get("id") ?? "").trim();
    if (!id) return { error: "Missing outlet id." };
    const { error } = await supabase.from("outlets").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/owner/outlets");
    return { ok: true };
  } catch (err: any) {
    console.error("deleteOutlet exception:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}
