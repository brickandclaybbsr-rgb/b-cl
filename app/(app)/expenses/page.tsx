import { requireProfile } from "@/lib/auth";
import { getTodayCashExpenses } from "@/lib/data/expenses";
import { formatDateLabel } from "@/lib/date";
import { todayIST } from "@/lib/date";
import { PageHeader } from "@/components/page-header";
import { ExpenseClient } from "@/components/expenses/expense-client";

export const metadata = { title: "Cash Expenses" };

export default async function ExpensesPage() {
  const profile = await requireProfile();
  const [entries] = await Promise.all([getTodayCashExpenses()]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Cash Expenses"
        subtitle={formatDateLabel(todayIST())}
      />
      <ExpenseClient
        todayEntries={entries}
        isOwner={profile.role === "owner"}
      />
    </div>
  );
}
