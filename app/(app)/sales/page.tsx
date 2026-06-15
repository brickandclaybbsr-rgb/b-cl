import { requireProfile } from "@/lib/auth";
import { todayIST, daysAgoIST, nowIST, formatDateLabel, formatTimeIST } from "@/lib/date";
import { APP_START_DATE } from "@/lib/constants";
import { getSales, getSalesRange } from "@/lib/data/sales";
import { getProfileNameMap, getStaff } from "@/lib/data/profiles";
import { getTodayCashExpenses } from "@/lib/data/expenses";
import { PageHeader } from "@/components/page-header";
import { SalesTabs } from "./sales-tabs";
import { SalesForm } from "./sales-form";
import { SalesView } from "./sales-view";
import { ExpenseClient } from "@/components/expenses/expense-client";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Info, AlertTriangle } from "lucide-react";

export const metadata = { title: "Daily sales" };

export default async function SalesPage({
  searchParams,
}: {
  searchParams: { tab?: string; date?: string };
}) {
  const profile = await requireProfile();
  const isKitchenOnly = profile.team === "kitchen";

  if (searchParams.tab === "expenses") {
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

  // ── Sales tab ────────────────────────────────────────────────────────────
  const today = todayIST();
  const windowStart = APP_START_DATE;

  // Validate requested date: must be within the 7-day window and not in the future
  const requestedDate = (() => {
    const d = String(searchParams.date ?? "").trim();
    if (d >= windowStart && d <= today) return d;
    return today;
  })();

  // Fetch all sales in the window to find missing dates
  const [allSalesInWindow, existing] = await Promise.all([
    getSalesRange(windowStart, today),
    getSales(requestedDate),
  ]);

  const filedDates = new Set(allSalesInWindow.map((s) => s.date));

  // All dates from launch with no sales entry (oldest first)
  const missingDates: string[] = [];
  for (let d = new Date(windowStart + "T00:00:00Z"); ; d.setUTCDate(d.getUTCDate() + 1)) {
    const str = d.toISOString().slice(0, 10);
    if (str >= today) break; // today can still be filed tonight — never show as missing
    if (!filedDates.has(str)) missingDates.push(str);
  }

  const isOwner = profile.role === "owner";
  const isSubmitter = existing?.submitted_by === profile.id;
  const viewingToday = requestedDate === today;

  // Sales for today can only be filed after 9:00 PM IST
  const istHour = nowIST().getHours();
  const salesOpenToday = istHour >= 21; // 9 PM IST
  const tooEarlyForToday = viewingToday && !salesOpenToday && !existing;

  // Missing dates excluding the one currently being viewed
  const otherMissing = missingDates.filter((d) => d !== requestedDate);

  // For kitchen notice
  const frontDeskNames = isKitchenOnly
    ? (await getStaff())
        .filter((s) => s.team === "front_desk" && s.is_active)
        .map((s) => s.name.split(" ")[0])
        .join(" / ")
    : null;

  // ── Already submitted by someone else ───────────────────────────────────
  if (existing && !isOwner && !isSubmitter) {
    const nameMap = await getProfileNameMap();
    const submitterName = existing.submitted_by
      ? nameMap[existing.submitted_by] ?? "another staff member"
      : "another staff member";
    return (
      <div>
        <PageHeader title="Daily Sales" subtitle={formatDateLabel(requestedDate)} />
        <SalesTabs />
        {otherMissing.length > 0 && (
          <MissingDatesBanner missing={otherMissing} />
        )}
        <Card className="p-6 text-center max-w-lg mx-auto mt-4 space-y-4">
          <div className="flex justify-center">
            <div className="bg-success/15 text-success rounded-full p-3">
              <CheckCircle2 className="size-8" />
            </div>
          </div>
          <h2 className="text-lg font-bold text-content-primary">
            {viewingToday ? "Today's" : formatDateLabel(requestedDate)} Sales Already Submitted
          </h2>
          <p className="text-sm text-content-secondary">
            Submitted by{" "}
            <span className="font-semibold text-content-primary">{submitterName}</span> at{" "}
            <span className="font-semibold text-content-primary">
              {formatTimeIST(existing.submitted_at)}
            </span>.
          </p>
          <p className="text-xs text-content-secondary">
            Sales entries are completed by one person per day.
          </p>
        </Card>
      </div>
    );
  }

  // ── Form / view ──────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader title="Daily Sales" subtitle={formatDateLabel(requestedDate)} />
      <SalesTabs />

      {/* Missing dates banner */}
      {otherMissing.length > 0 && <MissingDatesBanner missing={otherMissing} />}

      {/* Backdate context strip */}
      {!viewingToday && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm">
          <span className="flex-1 text-content-secondary">
            Filing sales for{" "}
            <span className="font-semibold text-content-primary">{formatDateLabel(requestedDate)}</span>
          </span>
          <a href="/sales" className="shrink-0 text-xs font-semibold text-warm hover:underline">
            Switch to today →
          </a>
        </div>
      )}

      {isKitchenOnly && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm text-content-secondary">
          <Info className="mt-0.5 size-4 shrink-0" />
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
      ) : tooEarlyForToday ? (
        <Card className="p-6 text-center max-w-lg mx-auto space-y-3">
          <p className="text-4xl">🕘</p>
          <h2 className="text-lg font-bold text-content-primary">Sales open after 9:00 PM</h2>
          <p className="text-sm text-content-secondary">
            Today&apos;s sales can be filed from <span className="font-semibold text-content-primary">9:00 PM IST</span> onwards.
            Come back then to enter the figures.
          </p>
        </Card>
      ) : (
        <SalesForm date={requestedDate} />
      )}
    </div>
  );
}

function MissingDatesBanner({ missing }: { missing: string[] }) {
  const label =
    missing.length === 1
      ? formatDateLabel(missing[0])
      : `${missing.length} days`;

  return (
    <div className="mb-4 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <div className="flex-1">
          <p className="font-semibold">
            Sales missing for {label}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {missing.map((d) => (
              <a
                key={d}
                href={`/sales?date=${d}`}
                className="rounded-lg border border-warning/40 bg-warning/15 px-2.5 py-1 text-xs font-semibold text-warning hover:bg-warning/25"
              >
                {formatDateLabel(d)}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
