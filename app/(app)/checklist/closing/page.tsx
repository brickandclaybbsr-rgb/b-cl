import { requireProfile } from "@/lib/auth";
import { todayIST, formatDateLabel, formatTimeIST } from "@/lib/date";
import { getChecklistConfig, getClosingChecklist } from "@/lib/data/checklists";
import { getProfileNameMap } from "@/lib/data/profiles";
import { getStockSnapshotForDate } from "@/lib/data/stock";
import { PageHeader } from "@/components/page-header";
import { ChecklistTabs } from "@/components/checklists/checklist-tabs";
import { ChecklistForm } from "@/components/checklists/checklist-form";
import { ChecklistView } from "@/components/checklists/checklist-view";
import { submitClosingChecklist } from "../actions";
import { Card } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

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

  return (
    <div>
      <PageHeader title="Closing Checklist" subtitle={formatDateLabel(date)} />
      <ChecklistTabs />
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
          config={await getChecklistConfig("closing")}
          action={submitClosingChecklist}
          isStockUpdated={Boolean(stockSnapshot)}
        />
      )}
    </div>
  );
}
