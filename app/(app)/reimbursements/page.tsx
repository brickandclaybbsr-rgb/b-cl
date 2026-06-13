import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getProfileNameMap } from "@/lib/data/profiles";
import { PageHeader } from "@/components/page-header";
import { ReimbursementClaimForm } from "./claim-form";
import { ReimbursementsList, type ReimbursementView } from "./claims-list";
import { Card } from "@/components/ui/card";
import { Clock, CheckCircle2, Wallet, Users } from "lucide-react";

export const metadata = { title: "Reimbursements" };

export default async function ReimbursementsPage() {
  const profile = await requireProfile();
  const isOwner = profile.role === "owner";
  const supabase = createClient();

  // Query claims
  let query = supabase
    .from("reimbursements")
    .select("*")
    .order("submitted_at", { ascending: false });

  if (!isOwner) {
    query = query.eq("submitted_by", profile.id);
  }

  const { data: claimsData } = await query;
  const rawClaims = claimsData ?? [];

  // Resolve user profile names
  const nameMap = await getProfileNameMap();
  const claims: ReimbursementView[] = rawClaims.map((c) => ({
    ...c,
    submitted_by_name: nameMap[c.submitted_by] ?? "Staff member",
    processed_by_name: c.processed_by ? nameMap[c.processed_by] ?? "Owner" : undefined,
  }));

  // Aggregate stats
  const pendingAmount = claims
    .filter((c) => c.status === "pending")
    .reduce((sum, c) => sum + Number(c.amount), 0);

  const approvedAmount = claims
    .filter((c) => c.status === "approved" || c.status === "paid")
    .reduce((sum, c) => sum + Number(c.amount), 0);

  const totalAmount = claims
    .reduce((sum, c) => sum + Number(c.amount), 0);

  // Group by profile for Owner dashboard summary
  const profileBreakdownMap: Record<string, {
    name: string;
    pending: number;
    approved: number;
    paid: number;
    total: number;
  }> = {};

  claims.forEach((c) => {
    const key = c.submitted_by;
    if (!profileBreakdownMap[key]) {
      profileBreakdownMap[key] = {
        name: c.submitted_by_name,
        pending: 0,
        approved: 0,
        paid: 0,
        total: 0,
      };
    }
    const amt = Number(c.amount);
    if (c.status === "pending") profileBreakdownMap[key].pending += amt;
    else if (c.status === "approved") profileBreakdownMap[key].approved += amt;
    else if (c.status === "paid") profileBreakdownMap[key].paid += amt;
    profileBreakdownMap[key].total += amt;
  });

  const profileBreakdowns = Object.values(profileBreakdownMap);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cash Expenses"
        subtitle={
          isOwner
            ? "Review and reconcile store cash expenses recorded by staff"
            : "Record store cash expenses — for purchases already made from the drawer"
        }
      />

      {/* Stats Cards Dashboard */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-4 p-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-warning/10 text-warning">
            <Clock className="size-6" />
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
          <div className="flex size-12 items-center justify-center rounded-xl bg-success/10 text-success">
            <CheckCircle2 className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-content-secondary">
              Reconciled
            </p>
            <p className="mt-0.5 text-lg font-bold text-content-primary">
              ₹{approvedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-fire/10 text-fire">
            <Wallet className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-content-secondary">
              Total Cash Spent
            </p>
            <p className="mt-0.5 text-lg font-bold text-content-primary">
              ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </Card>
      </div>

      {/* Profile-wise breakdown for Owner */}
      {isOwner && profileBreakdowns.length > 0 && (
        <Card className="p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-warm">
            <Users className="size-4" />
            Staff Expense Summary
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border text-xs uppercase text-content-secondary font-bold">
                  <th className="py-2.5">Staff Member</th>
                  <th className="py-2.5 text-right">Pending</th>
                  <th className="py-2.5 text-right">Approved</th>
                  <th className="py-2.5 text-right">Paid</th>
                  <th className="py-2.5 text-right">Total Claimed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {profileBreakdowns.map((pb) => (
                  <tr key={pb.name} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 font-medium text-content-primary">{pb.name}</td>
                    <td className="py-3 text-right font-semibold text-warning">
                      ₹{pb.pending.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 text-right font-semibold text-success">
                      ₹{pb.approved.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 text-right font-semibold text-fire">
                      ₹{pb.paid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 text-right font-bold text-content-primary">
                      ₹{pb.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Grid Layout depending on Role */}
      {isOwner ? (
        // Owner Layout: Claims list occupies full width
        <div className="w-full">
          <ReimbursementsList claims={claims} isOwner={isOwner} />
        </div>
      ) : (
        // Staff Layout: Form + Claims List side-by-side
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <ReimbursementClaimForm />
          </div>
          <div className="lg:col-span-2">
            <ReimbursementsList claims={claims} isOwner={isOwner} />
          </div>
        </div>
      )}
    </div>
  );
}
