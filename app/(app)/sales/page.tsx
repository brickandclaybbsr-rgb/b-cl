import { requireProfile } from "@/lib/auth";
import { todayIST, formatDateLabel, formatTimeIST } from "@/lib/date";
import { getSales } from "@/lib/data/sales";
import { getProfileNameMap, getStaff } from "@/lib/data/profiles";
import { getTodayCashExpenses } from "@/lib/data/expenses";
import { PageHeader } from "@/components/page-header";
import { SalesTabs } from "./sales-tabs";
import { SalesForm } from "./sales-form";
import { SalesView } from "./sales-view";
import { ExpenseClient } from "@/components/expenses/expense-client";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Info } from "lucide-react";

export const metadata = { title: "Daily sales" };

export default async function SalesPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const profile = await requireProfile();
  // Plain kitchen staff see a notice; head_chef has full access
  const isKitchenOnly = profile.team === "kitchen";

  const isExpenses = searchParams.tab === "expenses";

  if (isExpenses) {
    const isOwner = profile.role === "owner";
    const todayEntries = await getTodayCashExpenses();

    return (
      <div className="space-y-5">
        <PageHeader
          title="Daily Sales"
          subtitle={isOwner ? "Today's cash out" : "Log cash withdrawals & expenses"}
        />
        <SalesTabs />
        <ExpenseClient todayEntries={todayEntries} isOwner={isOwner} />
      </div>
    );
  }

  // ── Sales tab (default) ──────────────────────────────────────────────────
  const date = todayIST();
  const existing = await getSales(date);
  const isOwner = profile.role === "owner";
  const isSubmitter = existing && existing.submitted_by === profile.id;

  // For the kitchen notice, find front-desk staff names
  const frontDeskNames = isKitchenOnly
    ? (await getStaff())
        .filter((s) => s.team === "front_desk" && s.is_active)
        .map((s) => s.name.split(" ")[0])
        .join(" / ")
    : null;

  if (existing && !isOwner && !isSubmitter) {
    const nameMap = await getProfileNameMap();
    const submitterName = existing.submitted_by
      ? nameMap[existing.submitted_by] ?? "another staff member"
      : "another staff member";
    return (
      <div>
        <PageHeader title="Daily Sales" subtitle={formatDateLabel(date)} />
        <SalesTabs />
        <Card className="p-6 text-center max-w-lg mx-auto mt-4 space-y-4">
          <div className="flex justify-center">
            <div className="bg-success/15 text-success rounded-full p-3 animate-pulse">
              <CheckCircle2 className="size-8" />
            </div>
          </div>
          <h2 className="text-lg font-bold text-content-primary">Daily Sales Already Submitted</h2>
          <p className="text-sm text-content-secondary">
            Today&apos;s daily sales were submitted by{" "}
            <span className="font-semibold text-content-primary">{submitterName}</span> at{" "}
            <span className="font-semibold text-content-primary">
              {formatTimeIST(existing.submitted_at)}
            </span>.
          </p>
          <p className="text-xs text-content-secondary">
            Sales entries are completed by one person per day. Double submissions are not required.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Daily Sales" subtitle={formatDateLabel(date)} />
      <SalesTabs />
      {isKitchenOnly && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm text-content-secondary">
          <Info className="mt-0.5 size-4 shrink-0 text-content-secondary" />
          <span>
            Daily sales are filled by the{" "}
            <span className="font-semibold text-content-primary">
              Front Desk team{frontDeskNames ? ` (${frontDeskNames})` : ""}
            </span>
            . If they&apos;re unavailable, you can fill it here.
          </span>
        </div>
      )}
      {existing ? (
        <SalesView
          sales={existing}
          submitterName={
            existing.submitted_by
              ? (await getProfileNameMap())[existing.submitted_by] ?? "Staff"
              : "Staff"
          }
        />
      ) : (
        <SalesForm />
      )}
    </div>
  );
}
