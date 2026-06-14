import { Check, X, CircleCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { groupBySection } from "@/lib/data/checklists";
import { formatINR } from "@/lib/utils";
import { formatTimeIST } from "@/lib/date";
import type {
  OpeningChecklist,
  ClosingChecklist,
} from "@/lib/database.types";

const TEAM_SECTIONS: Record<string, string[]> = {
  kitchen: ["Kitchen"],
  front_desk: ["Front Desk", "Staff"],
};

export function ChecklistView({
  record,
  variant,
  submitterName,
  team,
}: {
  record: OpeningChecklist | ClosingChecklist;
  variant: "opening" | "closing";
  submitterName: string;
  team?: "kitchen" | "front_desk" | null;
}) {
  const allGroups = groupBySection(record.items);
  // When a team is known, only show that team's sections so kitchen staff
  // don't see front-desk rows and vice versa (even if stored together).
  const owned = team ? TEAM_SECTIONS[team] ?? [] : [];
  const groups = owned.length > 0
    ? allGroups.filter((g) => owned.some((prefix) => g.section.startsWith(prefix)))
    : allGroups;
  const displayedItems = groups.flatMap((g) => g.items);
  const done = displayedItems.filter((i) => i.checked).length;
  const total = displayedItems.length;

  return (
    <div className="space-y-4">
      <Card className="flex items-center gap-3 border-success/30 bg-success/10 p-4">
        <CircleCheck className="size-6 shrink-0 text-success" />
        <div className="flex-1">
          <p className="font-semibold text-success">
            {variant === "opening" ? "Opening" : "Closing"} checklist submitted
            {team === "kitchen" && " (Kitchen)"}
            {team === "front_desk" && " (Front Desk)"}
          </p>
          <p className="text-xs text-content-secondary">
            By {submitterName} · {formatTimeIST(record.submitted_at)} ·{" "}
            <span className="tabular">
              {done}/{total}
            </span>{" "}
            done
          </p>
        </div>
      </Card>

      {groups.map((group) => (
        <Card key={group.section} className="overflow-hidden">
          <div className="border-b border-border px-4 py-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-warm">
              {group.section}
            </h2>
          </div>
          <div className="divide-y divide-border">
            {group.items.map((item, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3">
                <span
                  className={`flex size-5 shrink-0 items-center justify-center rounded-md ${
                    item.checked
                      ? "bg-success text-white"
                      : "bg-danger/20 text-danger"
                  }`}
                >
                  {item.checked ? (
                    <Check className="size-3.5" strokeWidth={3} />
                  ) : (
                    <X className="size-3.5" strokeWidth={3} />
                  )}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-content-primary">{item.label}</p>
                  {item.note && (
                    <p className="mt-0.5 text-xs text-warm">↳ {item.note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}

      <Card className="space-y-2.5 p-4">
        {variant === "opening" ? (
          <>
            <Row label="Opening cash" value={fmtCash((record as OpeningChecklist).opening_cash)} />
            {(record as OpeningChecklist).absent_staff && (
              <Row label="Absent staff" value={(record as OpeningChecklist).absent_staff!} />
            )}
          </>
        ) : (
          <>
            <Row label="Closing cash" value={fmtCash((record as ClosingChecklist).closing_cash)} />
            <Row label="Deposited to safe" value={fmtCash((record as ClosingChecklist).cash_deposited)} />
            {(record as ClosingChecklist).discrepancy_notes && (
              <Row
                label="Discrepancy"
                value={(record as ClosingChecklist).discrepancy_notes!}
              />
            )}
          </>
        )}
        {record.notes && <Row label="Notes" value={record.notes} />}
        {record.photo_url && (
          <div className="pt-1">
            <p className="mb-1.5 text-xs text-content-secondary">Photo</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <a href={record.photo_url} target="_blank" rel="noreferrer">
              <img
                src={record.photo_url}
                alt="Checklist photo"
                className="w-full rounded-xl object-cover"
                style={{ maxHeight: 240 }}
              />
            </a>
          </div>
        )}
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-content-secondary">{label}</span>
      <span className="text-right font-medium text-content-primary">{value}</span>
    </div>
  );
}

function fmtCash(v: number | null) {
  return v === null ? "—" : <span className="tabular">{formatINR(v)}</span>;
}
