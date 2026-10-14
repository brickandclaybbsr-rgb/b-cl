import { requireProfile } from "@/lib/auth";
import { getStaff } from "@/lib/data/profiles";
import { getTodayCashExpenses } from "@/lib/data/expenses";
import { getOutletContext } from "@/lib/data/outlets";
import { OutletSwitcher } from "@/components/outlet-switcher";
import { formatDateLabel } from "@/lib/date";
import { todayIST } from "@/lib/date";
import { PageHeader } from "@/components/page-header";
import { ExpenseClient } from "@/components/expenses/expense-client";

export const metadata = { title: "Cash Expenses" };

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: { outlet?: string };
}) {
  const profile = await requireProfile();

  // Cash outs belong to one outlet, like sales and the checklists. This used
  // to read every outlet's entries, so Patia staff saw Saheed Nagar's cash
  // outs and vice versa — and the day's total was the two branches added up.
  const outlet = await getOutletContext(profile, searchParams.outlet);

  const [entries, staff] = await Promise.all([
    getTodayCashExpenses(outlet.activeId),
    getStaff(),
  ]);
  const staffNames = staff.filter((s) => s.role !== "owner").map((s) => s.name);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Cash Expenses"
        subtitle={`${outlet.active?.name ?? ""} · ${formatDateLabel(todayIST())}`}
      />
      <OutletSwitcher
        outlets={outlet.outlets}
        activeId={outlet.activeId}
        canSwitch={outlet.canSwitch}
      />
      <ExpenseClient
        entries={entries}
        isOwner={profile.role === "owner"}
        canDeleteAll={profile.role === "owner" || profile.team === "head_chef"}
        viewingDate={todayIST()}
        staffNames={staffNames}
        outletId={outlet.activeId}
      />
    </div>
  );
}
