import { requireProfile } from "@/lib/auth";
import { todayIST, formatDateLabel, formatTimeIST } from "@/lib/date";
import { getSales } from "@/lib/data/sales";
import { getProfileNameMap } from "@/lib/data/profiles";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { SalesTabs } from "./sales-tabs";
import { SalesForm } from "./sales-form";
import { SalesView } from "./sales-view";
import { ReimbursementClaimForm } from "@/app/(app)/reimbursements/claim-form";
import { ReimbursementsList, type ReimbursementView } from "@/app/(app)/reimbursements/claims-list";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Clock, Wallet } from "lucide-react";

export const metadata = { title: "Daily sales" };

export default async function SalesPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const profile = await requireProfile();
  const isExpenses = searchParams.tab === "expenses";

  if (isExpenses) {
    const supabase = createClient();
    const isOwner = profile.role === "owner";

    let query = supabase
      .from("reimbursements")
      .select("*")
      .order("submitted_at", { ascending: false });

    if (!isOwner) query = query.eq("submitted_by", profile.id);

    const { data: claimsData } = await query;
    const rawClaims = claimsData ?? [];
    const nameMap = await getProfileNameMap();

    const claims: ReimbursementView[] = rawClaims.map((c) => ({
      ...c,
      submitted_by_name: nameMap[c.submitted_by] ?? "Staff member",
      processed_by_name: c.processed_by ? nameMap[c.processed_by] ?? "Owner" : undefined,
    }));

    const pendingAmount = claims
      .filter((c) => c.status === "pending")
      .reduce((sum, c) => sum + Number(c.amount), 0);

    return (
      <div className="space-y-5">
        <PageHeader
          title="Daily Sales"
          subtitle={isOwner
            ? "Review and reconcile store cash expenses"
            : "Record store cash expenses from the drawer"}
        />
        <SalesTabs />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card className="flex items-center gap-4 p-4">
            <div className="flex size-11 items-center justify-center rounded-xl bg-warning/10 text-warning">
              <Clock className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-content-secondary">
                Needs Reconciliation
              </p>
              <p className="mt-0.5 text-lg font-bold text-content-primary">
                ₹{pendingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </Card>
          <Card className="flex items-center gap-4 p-4">
            <div className="flex size-11 items-center justify-center rounded-xl bg-fire/10 text-fire">
              <Wallet className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-content-secondary">
                Total Cash Spent
              </p>
              <p className="mt-0.5 text-lg font-bold text-content-primary">
                ₹{claims.reduce((s, c) => s + Number(c.amount), 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </Card>
        </div>

        {isOwner ? (
          <ReimbursementsList claims={claims} isOwner />
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <ReimbursementClaimForm />
            </div>
            <div className="lg:col-span-2">
              <ReimbursementsList claims={claims} isOwner={false} />
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Sales tab (default) ──────────────────────────────────────────────────
  const date = todayIST();
  const existing = await getSales(date);
  const isOwner = profile.role === "owner";
  const isSubmitter = existing && existing.submitted_by === profile.id;

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
