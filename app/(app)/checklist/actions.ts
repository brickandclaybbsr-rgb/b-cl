"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile, isHeadChef } from "@/lib/auth";
import { getChecklistConfig } from "@/lib/data/checklists";
import { todayIST } from "@/lib/date";
import { toNumber } from "@/lib/utils";
import { uploadPublicFile } from "@/lib/storage";
import { whatsappNotify } from "@/lib/whatsapp-notify";
import { notifyOwner } from "@/lib/push";
import type { ChecklistLine } from "@/lib/database.types";

export type ChecklistFormState = { ok?: boolean; error?: string };

async function uploadChecklistPhoto(
  formData: FormData,
  date: string,
  variant: "opening" | "closing",
  team: string,
): Promise<string | null> {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return null;
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() ?? "jpg";
    return await uploadPublicFile(
      `checklists/${variant}`,
      `${date}_${team}.${ext}`,
      buf,
      file.type || "image/jpeg",
    );
  } catch {
    return null;
  }
}

function buildItems(
  config: { section: string; label: string }[],
  formData: FormData,
): ChecklistLine[] {
  return config.map((c, i) => {
    const note = String(formData.get(`note_${i}`) ?? "").trim();
    return {
      section: c.section,
      label: c.label,
      checked: formData.get(`check_${i}`) === "on",
      ...(note ? { note } : {}),
    };
  });
}

export async function submitOpeningChecklist(
  _prev: ChecklistFormState,
  formData: FormData,
): Promise<ChecklistFormState> {
  const profile = await requireProfile();
  const supabase = createClient();
  const date = todayIST();

  // Any staff can cover the other team via _team_override hidden field
  const teamOverride = String(formData.get("_team_override") ?? "").trim();
  const ownTeam: "kitchen" | "front_desk" | null =
    profile.team === "head_chef" ? "kitchen"
    : (profile.team as "kitchen" | "front_desk" | null) ?? null;
  const team: "kitchen" | "front_desk" | null =
    (teamOverride === "kitchen" || teamOverride === "front_desk") ? teamOverride : ownTeam;
  const teamKey = team ?? "all";
  const config = await getChecklistConfig("opening", profile.role === "owner" ? null : team);
  const items = buildItems(config, formData);

  const openingCashRaw = formData.get("opening_cash");
  const photoUrl = await uploadChecklistPhoto(formData, date, "opening", teamKey);
  const payload = {
    date,
    team: teamKey,
    submitted_by: profile.id,
    items,
    opening_cash: openingCashRaw === null || openingCashRaw === "" ? null : toNumber(openingCashRaw),
    notes: String(formData.get("notes") ?? "").trim() || null,
    photo_url: photoUrl,
  };

  // Edit mode: upsert so the original record is never lost if something goes wrong
  if (formData.get("_edit_mode") === "1" && isHeadChef(profile)) {
    const admin = createAdminClient();
    const { error } = await admin
      .from("opening_checklists")
      .upsert(payload, { onConflict: "date,team" });
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("opening_checklists").insert(payload);
    if (error) {
      if (error.code === "23505") {
        return { error: "Your team's opening checklist for today is already submitted." };
      }
      return { error: error.message };
    }
  }

  await whatsappNotify.checklistSubmitted(profile.name, "opening");
  await notifyOwner.checklistSubmitted(profile.name, "opening");

  revalidatePath("/checklist/opening");
  revalidatePath("/dashboard");
  revalidatePath("/owner");
  return { ok: true };
}

export async function submitClosingChecklist(
  _prev: ChecklistFormState,
  formData: FormData,
): Promise<ChecklistFormState> {
  const profile = await requireProfile();
  const supabase = createClient();
  const date = todayIST();

  const teamOverride = String(formData.get("_team_override") ?? "").trim();
  const team: "kitchen" | "front_desk" | null =
    profile.team === "head_chef"
      ? (teamOverride === "front_desk" ? "front_desk" : "kitchen")
      : (profile.team as "kitchen" | "front_desk" | null) ?? null;
  const teamKey = team ?? "all";
  const config = await getChecklistConfig("closing", profile.role === "owner" ? null : team);
  const items = buildItems(config, formData);

  const closingCashRaw = formData.get("closing_cash");
  const depositedRaw = formData.get("cash_deposited");
  const photoUrl = await uploadChecklistPhoto(formData, date, "closing", teamKey);

  const payload = {
    date,
    team: teamKey,
    submitted_by: profile.id,
    items,
    closing_cash: closingCashRaw === null || closingCashRaw === "" ? null : toNumber(closingCashRaw),
    cash_deposited: depositedRaw === null || depositedRaw === "" ? null : toNumber(depositedRaw),
    discrepancy_notes: String(formData.get("discrepancy_notes") ?? "").trim() || null,
    closing_stock_updated: false,
    notes: String(formData.get("notes") ?? "").trim() || null,
    photo_url: photoUrl,
  };

  if (formData.get("_edit_mode") === "1" && isHeadChef(profile)) {
    const admin = createAdminClient();
    const { error } = await admin
      .from("closing_checklists")
      .upsert(payload, { onConflict: "date,team" });
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("closing_checklists").insert(payload);
    if (error) {
      if (error.code === "23505") {
        return { error: "Your team's closing checklist for today is already submitted." };
      }
      return { error: error.message };
    }
  }

  await whatsappNotify.checklistSubmitted(profile.name, "closing");
  await notifyOwner.checklistSubmitted(profile.name, "closing");

  revalidatePath("/checklist/closing");
  revalidatePath("/dashboard");
  revalidatePath("/owner");
  return { ok: true };
}
