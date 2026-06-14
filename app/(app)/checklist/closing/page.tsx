import { requireProfile, isHeadChef } from "@/lib/auth";
import { todayIST, formatDateLabel, formatTimeIST } from "@/lib/date";
import {
  getChecklistConfig,
  getOtherTeamConfig,
  getClosingChecklist,
  isOtherTeamAbsentToday,
} from "@/lib/data/checklists";
import { getProfileNameMap } from "@/lib/data/profiles";
import { PageHeader } from "@/components/page-header";
import { ChecklistTabs } from "@/components/checklists/checklist-tabs";
import { ChecklistForm } from "@/components/checklists/checklist-form";
import { ChecklistView } from "@/components/checklists/checklist-view";
import { submitClosingChecklist } from "../actions";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Clock, AlertTriangle, UserX } from "lucide-react";

export const metadata = { title: "Closing checklist" };

export default async function ClosingChecklistPage({
  searchParams,
}: {
  searchParams: { edit?: string };
}) {
  const profile = await requireProfile();
  const date = todayIST();

  const isOwner = profile.role === "owner";
  const headChef = isHeadChef(profile);
  const kitchenEditMode = headChef && searchParams.edit === "1";
  // head_chef shares the kitchen checklist record
  const myTeam: "kitchen" | "front_desk" | null =
    profile.team === "head_chef" ? "kitchen"
    : (profile.team as "kitchen" | "front_desk" | null | undefined) ?? null;
  const otherTeam: "kitchen" | "front_desk" | null =
    myTeam === "kitchen" ? "front_desk" : myTeam === "front_desk" ? "kitchen" : null;
  const teamKey = myTeam ?? "all";

  // Staff must have a team assigned before they can use the checklist
  if (!isOwner && !headChef && myTeam === null) {
    return (
      <div>
        <PageHeader title="Closing Checklist" subtitle={formatDateLabel(date)} />
        <ChecklistTabs />
        <Card className="p-6 text-center max-w-lg mx-auto mt-4 space-y-3">
          <div className="flex justify-center">
            <div className="bg-warning/15 text-warning rounded-full p-3">
              <UserX className="size-8" />
            </div>
          </div>
          <h2 className="text-lg font-bold text-content-primary">Team Not Assigned</h2>
          <p className="text-sm text-content-secondary">
            Ask the owner to assign your team (Kitchen or Front Desk) before you can submit checklists.
          </p>
        </Card>
      </div>
    );
  }

  // ── Head chef: sees both kitchen and front desk ──────────────────────────
  if (headChef) {
    const [kitchenRecord, frontDeskRecord, nameMap, kitchenConfig, frontDeskConfig] = await Promise.all([
      getClosingChecklist(date, "kitchen"),
      getClosingChecklist(date, "front_desk"),
      getProfileNameMap(),
      getChecklistConfig("closing", "kitchen"),
      getChecklistConfig("closing", "front_desk"),
    ]);

    return (
      <div>
        <PageHeader title="Closing Checklist" subtitle={formatDateLabel(date)} />
        <ChecklistTabs />

        {/* Kitchen section */}
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-warm">Kitchen</p>
        {kitchenRecord && !kitchenEditMode ? (
          <>
            <div className="mb-2 flex justify-end">
              <a
                href="/checklist/closing?edit=1"
                className="rounded-lg border border-border bg-bg-elevated px-3 py-1.5 text-xs font-medium text-content-secondary hover:border-border-strong hover:text-content-primary transition-colors"
              >
                Edit / Re-submit
              </a>
            </div>
            <ChecklistView
              record={kitchenRecord}
              variant="closing"
              team="kitchen"
              submitterName={kitchenRecord.submitted_by ? nameMap[kitchenRecord.submitted_by] ?? "Staff" : "Staff"}
            />
          </>
        ) : (
          <ChecklistForm
            variant="closing"
            config={kitchenConfig}
            action={submitClosingChecklist}
            team="kitchen"
            hiddenFields={kitchenEditMode ? { _edit_mode: "1" } : undefined}
          />
        )}

        {/* Front desk section */}
        <p className="mb-2 mt-6 text-xs font-bold uppercase tracking-wider text-warm">Front Desk</p>
        {frontDeskRecord ? (
          <ChecklistView
            record={frontDeskRecord}
            variant="closing"
            team="front_desk"
            submitterName={frontDeskRecord.submitted_by ? nameMap[frontDeskRecord.submitted_by] ?? "Staff" : "Staff"}
          />
        ) : (
          <ChecklistForm
            variant="closing"
            config={frontDeskConfig}
            action={submitClosingChecklist}
            team="front_desk"
            hiddenFields={{ _team_override: "front_desk" }}
          />
        )}
      </div>
    );
  }

  // ── Regular staff ────────────────────────────────────────────────────────
  const existing = await getClosingChecklist(date, isOwner ? undefined : teamKey);
  const otherExisting = !isOwner && otherTeam
    ? await getClosingChecklist(date, otherTeam)
    : null;

  const isSubmitter = existing?.submitted_by === profile.id;

  if (existing && !isOwner && !isSubmitter) {
    const nameMap = await getProfileNameMap();
    const submitterName = existing.submitted_by
      ? nameMap[existing.submitted_by] ?? "a team member"
      : "a team member";
    return (
      <div>
        <PageHeader title="Closing Checklist" subtitle={formatDateLabel(date)} />
        <ChecklistTabs />
        <OtherTeamBanner otherTeam={otherTeam} otherExisting={otherExisting} nameMap={nameMap} />
        <Card className="p-6 text-center max-w-lg mx-auto mt-4 space-y-4">
          <div className="flex justify-center">
            <div className="bg-success/15 text-success rounded-full p-3">
              <CheckCircle2 className="size-8" />
            </div>
          </div>
          <h2 className="text-lg font-bold text-content-primary">Your Checklist is Done</h2>
          <p className="text-sm text-content-secondary">
            The {teamLabel(myTeam)} closing checklist was submitted by{" "}
            <span className="font-semibold text-content-primary">{submitterName}</span> at{" "}
            <span className="font-semibold text-content-primary">{formatTimeIST(existing.submitted_at)}</span>.
          </p>
        </Card>
      </div>
    );
  }

  let config = await getChecklistConfig("closing", isOwner ? null : myTeam);
  let coveringOtherTeam = false;

  if (!isOwner && myTeam) {
    const otherAbsent = await isOtherTeamAbsentToday(myTeam);
    if (otherAbsent) {
      const otherItems = await getOtherTeamConfig("closing", myTeam);
      config = [...config, ...otherItems];
      coveringOtherTeam = true;
    }
  }

  const nameMap = existing?.submitted_by ? await getProfileNameMap() : null;

  return (
    <div>
      <PageHeader title="Closing Checklist" subtitle={formatDateLabel(date)} />
      <ChecklistTabs />

      {coveringOtherTeam && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>Other team member is on leave today — their checklist tasks are included below.</span>
        </div>
      )}

      {!isOwner && (
        <OtherTeamBanner
          otherTeam={otherTeam}
          otherExisting={otherExisting}
          nameMap={nameMap ?? {}}
        />
      )}

      {existing ? (
        <ChecklistView
          record={existing}
          variant="closing"
          team={isOwner ? undefined : myTeam}
          submitterName={
            existing.submitted_by && nameMap
              ? nameMap[existing.submitted_by] ?? "Staff"
              : "Staff"
          }
        />
      ) : (
        <ChecklistForm
          variant="closing"
          config={config}
          action={submitClosingChecklist}
          team={myTeam}
        />
      )}
    </div>
  );
}

function teamLabel(team: "kitchen" | "front_desk" | null) {
  if (team === "kitchen") return "Kitchen";
  if (team === "front_desk") return "Front Desk";
  return "your team's";
}

function OtherTeamBanner({
  otherTeam,
  otherExisting,
  nameMap,
}: {
  otherTeam: "kitchen" | "front_desk" | null;
  otherExisting: { submitted_by: string | null; submitted_at: string } | null;
  nameMap: Record<string, string>;
}) {
  if (!otherTeam) return null;
  const label = teamLabel(otherTeam);

  if (otherExisting) {
    const name = otherExisting.submitted_by
      ? nameMap[otherExisting.submitted_by] ?? "Team member"
      : "Team member";
    return (
      <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-success/25 bg-success/8 px-4 py-3 text-sm text-success">
        <CheckCircle2 className="size-4 shrink-0" />
        <span>
          <span className="font-semibold">{label}</span> checklist submitted by{" "}
          <span className="font-semibold">{name}</span> at {formatTimeIST(otherExisting.submitted_at)}
        </span>
      </div>
    );
  }

  return (
    <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm text-content-secondary">
      <Clock className="size-4 shrink-0" />
      <span>
        <span className="font-semibold text-content-primary">{label}</span> checklist not submitted yet
      </span>
    </div>
  );
}
