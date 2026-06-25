"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOwner } from "@/lib/auth";
import { hasServiceRole } from "@/lib/supabase/env";

export type ActionState = { ok?: boolean; error?: string; message?: string };

/* ───────────────────────── Staff ───────────────────────── */

export async function createStaff(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireOwner();
  if (!hasServiceRole()) {
    return {
      error:
        "Service role key not configured. Add SUPABASE_SERVICE_ROLE_KEY to create accounts.",
    };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const VALID_ROLES = ["owner", "staff", "inventory_manager"] as const;
  type ValidRole = typeof VALID_ROLES[number];
  const rawRole = String(formData.get("role") ?? "staff");
  const role: ValidRole = (VALID_ROLES as readonly string[]).includes(rawRole)
    ? (rawRole as ValidRole)
    : "staff";

  if (!name || !email || password.length < 6) {
    return { error: "Name, email and a 6+ char password are required." };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role },
    });
    if (error) return { error: error.message };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create account." };
  }

  revalidatePath("/profile");
  return { ok: true, message: `${name} added.` };
}

export async function setStaffActive(id: string, isActive: boolean): Promise<ActionState> {
  await requireOwner();
  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/profile");
  return { ok: true };
}

export async function sendPasswordReset(email: string): Promise<ActionState> {
  await requireOwner();
  const supabase = createClient();
  const redirectTo = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/login`
    : undefined;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) return { error: error.message };
  return { ok: true, message: `Password reset email sent to ${email}.` };
}

/* ─────────────────────── Stock items ─────────────────────── */

export async function addStockItem(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireOwner();
  const supabase = createClient();
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || null;
  if (!name) return { error: "Item name is required." };

  const { error } = await supabase.from("stock_items").insert({ name, category });
  if (error) return { error: error.message };
  revalidatePath("/profile");
  revalidatePath("/stock");
  return { ok: true };
}

export async function toggleStockItem(id: string, isActive: boolean): Promise<ActionState> {
  await requireOwner();
  const supabase = createClient();
  const { error } = await supabase
    .from("stock_items")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/profile");
  revalidatePath("/stock");
  return { ok: true };
}

export async function deleteStockItem(id: string): Promise<ActionState> {
  await requireOwner();
  const supabase = createClient();
  const { error } = await supabase.from("stock_items").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/profile");
  revalidatePath("/stock");
  return { ok: true };
}

/* ───────────────────────── Vendors ───────────────────────── */

export async function addVendor(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireOwner();
  const supabase = createClient();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Vendor name is required." };

  const { error } = await supabase.from("vendors").insert({
    name,
    contact: String(formData.get("contact") ?? "").trim() || null,
    supply_category: String(formData.get("supply_category") ?? "").trim() || null,
    order_days: String(formData.get("order_days") ?? "").trim() || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/profile");
  revalidatePath("/vendors");
  return { ok: true };
}

export async function toggleVendor(id: string, isActive: boolean): Promise<ActionState> {
  await requireOwner();
  const supabase = createClient();
  const { error } = await supabase
    .from("vendors")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/profile");
  revalidatePath("/vendors");
  return { ok: true };
}

export async function deleteVendor(id: string): Promise<ActionState> {
  await requireOwner();
  const supabase = createClient();
  const { error } = await supabase.from("vendors").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/profile");
  revalidatePath("/vendors");
  return { ok: true };
}

/* ─────────────────────── Checklist items ─────────────────────── */

export async function addChecklistItem(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireOwner();
  const supabase = createClient();
  const type = String(formData.get("type") ?? "opening") === "closing" ? "closing" : "opening";
  const section = String(formData.get("section") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  if (!section || !label) return { error: "Section and item text are required." };

  // place new item at the end
  const { data: last } = await supabase
    .from("checklist_items")
    .select("sort_order")
    .eq("type", type)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("checklist_items").insert({
    type,
    section,
    label,
    sort_order: (last?.sort_order ?? 0) + 1,
  });
  if (error) return { error: error.message };
  revalidatePath("/profile");
  revalidatePath("/checklist/opening");
  revalidatePath("/checklist/closing");
  return { ok: true };
}

export async function toggleChecklistItem(id: string, isActive: boolean): Promise<ActionState> {
  await requireOwner();
  const supabase = createClient();
  const { error } = await supabase
    .from("checklist_items")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/profile");
  return { ok: true };
}

export async function deleteChecklistItem(id: string): Promise<ActionState> {
  await requireOwner();
  const supabase = createClient();
  const { error } = await supabase.from("checklist_items").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/profile");
  return { ok: true };
}

/* ───────────────────────── WhatsApp ───────────────────────── */

export async function saveOwnerWhatsApp(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireOwner();
  const supabase = createClient();
  const number = String(formData.get("owner_whatsapp_number") ?? "").replace(/[^\d]/g, "");
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: "owner_whatsapp_number", value: number || null, updated_at: new Date().toISOString() });
  if (error) return { error: error.message };
  revalidatePath("/profile");
  return { ok: true, message: "WhatsApp number saved." };
}

export async function updateStaffBiometrics(
  profileId: string,
  biometricPin: string,
  biometricName: string,
): Promise<ActionState> {
  await requireOwner();
  const supabase = createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      biometric_pin: biometricPin.trim() || null,
      biometric_name: biometricName.trim() || null,
    })
    .eq("id", profileId);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  revalidatePath("/attendance");
  return { ok: true, message: "Biometrics mapped." };
}
