import { requireProfile } from "@/lib/auth";
import { todayIST, formatDateLabel, formatTimeIST } from "@/lib/date";
import {
  getChecklistConfig,
  getOtherTeamConfig,
  getClosingChecklist,
  isOtherTeamAbsentToday,
} from "@/lib/data/checklists";
import { getProfileNameMap } from "@/lib/data/profiles";
import { getStockSnapshotForDate } from "@/lib/data/stock";
import { PageHeader } from "@/components/page-header";
import { ChecklistTabs } from "@/components/checklists/checklist-tabs";
import { ChecklistForm } from "@/components/checklists/checklist-form";
import { ChecklistView } from "@/components/checklists/checklist-view";
import { submitClosingChecklist } from "../actions";
import { Card } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle } from "lucide-react";

export const metadata = { title: "Closing checklist" };

export default async function ClosingChecklistPage() {
  const profile = await requireProfile();
  const date = todayIST();
  const existing = await getClosingChecklist(date);
  const stockSnapshot = await getStockSnapshotForDate(date);

  const isOwner = profile.role === "owner";
  const isSubmitter = existing && existing.submitted_by === profile.id;

  if (existing && !isOwner && !isSubmitter) {
    const nameMap = await getProfileNameMap();
    const submitterName = existing.submitted_by ? nameMap[existing.submitted_by] ?? "another staff member" : "another staff member";
    return (
      <div>
        <PageHeader title="Closing Checklist" subtitle={formatDateLabel(date)} />
        <ChecklistTabs />
        <Card className="p-6 text-center max-w-lg mx-auto mt-8 space-y-4">
          <div className="flex justify-center">
            <div className="bg-success/15 text-success rounded-full p-3 animate-pulse">
              <CheckCircle2 className="size-8" />
            </div>
          </div>
          <h2 className="text-lg font-bold text-content-primary">Checklist Already Completed</h2>
          <p className="text-sm text-content-secondary">
            Today's closing checklist was completed by <span className="font-semibold text-content-primary">{submitterName}</span> at <span className="font-semibold text-content-primary">{formatTimeIST(existing.submitted_at)}</span>.
          </p>
          <p className="text-xs text-content-secondary">
            Checklists are completed by one person per day. Double submissions are not required.
          </p>
        </Card>
      </div>
    );
  }

  const team = (profile.team as "kitchen" | "front_desk" | null | undefined) ?? null;

  let config = await getChecklistConfig("closing", isOwner ? null : team);
  let coveringOtherTeam = false;

  if (!isOwner && team) {
    const otherAbsent = await isOtherTeamAbsentToday(team);
    if (otherAbsent) {
      const otherItems = await getOtherTeamConfig("closing", team);
      config = [...config, ...otherItems];
      coveringOtherTeam = true;
    }
  }

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
      {existing ? (
        <ChecklistView
          record={existing}
          variant="closing"
          submitterName={
            existing.submitted_by
              ? (await getProfileNameMap())[existing.submitted_by] ?? "Staff"
              : "Staff"
          }
        />
      ) : (
        <ChecklistForm
          variant="closing"
          config={config}
          action={submitClosingChecklist}
          isStockUpdated={Boolean(stockSnapshot)}
        />
      )}
    </div>
  );
}
