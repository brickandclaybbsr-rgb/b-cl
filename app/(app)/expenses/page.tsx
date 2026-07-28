import { requireProfile } from "@/lib/auth";
import { getStaff } from "@/lib/data/profiles";
import { getTodayCashExpenses } from "@/lib/data/expenses";
import { formatDateLabel } from "@/lib/date";
import { todayIST } from "@/lib/date";
import { PageHeader } from "@/components/page-header";
import { ExpenseClient } from "@/components/expenses/expense-client";

export const metadata = { title: "Cash Expenses" };

export default async function ExpensesPage() {
  const profile = await requireProfile();
  const [entries, staff] = await Promise.all([getTodayCashExpenses(), getStaff()]);
  const staffNames = staff.filter((s) => s.role !== "owner").map((s) => s.name);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Cash Expenses"
        subtitle={formatDateLabel(todayIST())}
      />
      <ExpenseClient
        entries={entries}
        isOwner={profile.role === "owner"}
        canDeleteAll={profile.role === "owner" || profile.team === "head_chef"}
        viewingDate={todayIST()}
        staffNames={staffNames}
      />
    </div>
  );
}
