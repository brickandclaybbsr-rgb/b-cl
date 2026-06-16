import { requireProfile } from "@/lib/auth";
import { todayIST, daysAgoIST, nowIST, formatDateLabel, formatTimeIST } from "@/lib/date";
import { APP_START_DATE } from "@/lib/constants";
import { getSales, getSalesRange, salesTotal } from "@/lib/data/sales";
import { getProfileNameMap, getStaff } from "@/lib/data/profiles";
import { getCashExpensesByDate } from "@/lib/data/expenses";
import { formatINR } from "@/lib/utils";
import type { CashExpense } from "@/lib/database.types";
import { PageHeader } from "@/components/page-header";
import { SalesTabs } from "./sales-tabs";
import { SalesForm } from "./sales-form";
import { SalesView } from "./sales-view";
import { ExpenseClient } from "@/components/expenses/expense-client";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Info, AlertTriangle, ArrowRight, History } from "lucide-react";

export const metadata = { title: "Daily sales" };

export default async function SalesPage({
  searchParams,
}: {
  searchParams: { tab?: string; date?: string };
}) {
  const profile = await requireProfile();
  const isKitchenOnly = profile.team === "kitchen";

  const canSeeYesterday = profile.team === "front_desk" || profile.team === "head_chef";

  if (searchParams.tab === "expenses") {
    const isOwner = profile.role === "owner";
    const today = todayIST();
    const rawDate = String(searchParams.date ?? "").trim();
    const expenseDate = (rawDate >= APP_START_DATE && rawDate <= today) ? rawDate : today;
    const isViewingToday = expenseDate === today;
    const yesterday = daysAgoIST(1);

    const [entries, yesterdayEntries, yesterdaySalesForCash] = await Promise.all([
      getCashExpensesByDate(expenseDate),
      isViewingToday && canSeeYesterday ? getCashExpensesByDate(yesterday) : Promise.resolve([] as CashExpense[]),
      isViewingToday && canSeeYesterday ? getSales(yesterday) : Promise.resolve(null),
    ]);

    return (
      <div className="space-y-5">
        <PageHeader
          title="Daily Sales"
          subtitle={isOwner ? "Today's cash out" : "Log cash withdrawals & expenses"}
        />
        <SalesTabs />

        {/* Yesterday's closing cash = today's opening cash in drawer */}
        {isViewingToday && canSeeYesterday && yesterdaySalesForCash && (
          <div className="flex items-center justify-between rounded-xl border border-border bg-bg-elevated px-4 py-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-content-secondary">Opening Cash in Drawer</p>
              <p className="mt-0.5 text-[11px] text-content-secondary">Yesterday&apos;s closing balance</p>
            </div>
            <span className="font-mono text-lg font-bold tabular-nums text-content-primary">
              {formatINR(yesterdaySalesForCash.closing_balance)}
            </span>
          </div>
        )}

        {isViewingToday && canSeeYesterday && yesterdayEntries.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <History className="size-4 text-content-secondary" />
              <p className="text-xs font-bold uppercase tracking-wider text-content-secondary">
                Yesterday · {formatDateLabel(yesterday)}
              </p>
            </div>
            <Card className="divide-y divide-border">
              <div className="flex items-center justify-between px-4 py-3">
                <p className="text-sm font-semibold">Cash Out Total</p>
                <span className="font-mono text-sm font-bold tabular-nums text-danger">
                  -{formatINR(yesterdayEntries.reduce((s, e) => s + Number(e.amount), 0))}
                </span>
              </div>
              {yesterdayEntries.map((entry) => (
                <YesterdayCashRow key={entry.id} entry={entry} />
              ))}
            </Card>
          </div>
        )}
        <ExpenseClient entries={entries} isOwner={isOwner} viewingDate={expenseDate} />
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

  const yesterday = daysAgoIST(1);
  const yesterdaySales = viewingToday ? (allSalesInWindow.find(s => s.date === yesterday) ?? null) : null;

  // Sales for today can only be filed after 9:00 PM IST.
  // The business day runs until 4 AM next calendar day, so midnight–4 AM is
  // still "today" and filing must remain open (it's past 9 PM on that day).
  const istHour = nowIST().getHours();
  const salesOpenToday = istHour >= 21 || istHour < 4; // 9 PM – 4 AM window
  const tooEarlyForToday = viewingToday && !salesOpenToday && !existing;

  // Missing dates excluding the one currently being viewed
  const otherMissing = missingDates.filter((d) => d !== requestedDate);

  // Gate: front desk must file all previous days before today
  const gateForToday = !isOwner && !isKitchenOnly && missingDates.length > 0 && viewingToday;

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
        {otherMissing.length > 0 && !isKitchenOnly && (
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

      {/* Missing dates banner — hidden for kitchen team and when gate card already lists them */}
      {otherMissing.length > 0 && !isKitchenOnly && !gateForToday && <MissingDatesBanner missing={otherMissing} />}

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
      ) : gateForToday ? (
        <div className="mt-4 rounded-2xl border-2 border-amber-400/50 bg-gradient-to-b from-amber-400/15 to-amber-500/5 overflow-hidden">
          {/* Header strip */}
          <div className="flex items-center gap-3 border-b border-amber-400/20 px-5 py-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-400/20">
              <AlertTriangle className="size-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-content-primary">File previous sales first</h2>
              <p className="text-xs text-content-secondary mt-0.5">
                {missingDates.length === 1
                  ? "1 date is missing — file it to continue."
                  : `${missingDates.length} dates are missing — file them to continue.`}
              </p>
            </div>
          </div>
          {/* Date buttons */}
          <div className="px-5 py-4 space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-400/80 mb-3">
              Tap a date below to file its sales
            </p>
            {missingDates.map((d) => (
              <a
                key={d}
                href={`/sales?date=${d}`}
                className="flex w-full items-center justify-between rounded-xl bg-amber-400 px-4 py-3.5 text-sm font-bold text-amber-950 transition-all hover:bg-amber-300 active:scale-[0.98] shadow-md shadow-amber-400/20"
              >
                <span>{formatDateLabel(d)}</span>
                <span className="flex items-center gap-1.5">
                  File now
                  <ArrowRight className="size-4" />
                </span>
              </a>
            ))}
          </div>
        </div>
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

      {/* Yesterday's sales reference — front_desk and head_chef only */}
      {viewingToday && canSeeYesterday && (
        <div className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <History className="size-4 text-content-secondary" />
            <p className="text-xs font-bold uppercase tracking-wider text-content-secondary">
              Yesterday · {formatDateLabel(yesterday)}
            </p>
          </div>
          {yesterdaySales ? (
            <>
              <div className="mb-3 flex items-center justify-between rounded-xl bg-fire/10 px-4 py-3">
                <span className="text-sm font-semibold text-warm">Total Sales</span>
                <span className="font-mono text-lg font-bold tabular-nums text-warm">
                  {formatINR(salesTotal(yesterdaySales))}
                </span>
              </div>
              <Card className="divide-y divide-border">
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-xs text-content-secondary">Cash</span>
                  <span className="font-mono text-xs font-semibold tabular-nums">{formatINR(yesterdaySales.cash_sales)}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-xs text-content-secondary">Online (Card + UPI)</span>
                  <span className="font-mono text-xs font-semibold tabular-nums">{formatINR(Number(yesterdaySales.card_sales) + Number(yesterdaySales.upi_sales))}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-xs text-content-secondary">Aggregators</span>
                  <span className="font-mono text-xs font-semibold tabular-nums">{formatINR(yesterdaySales.aggregator_sales)}</span>
                </div>
              </Card>
              <p className="mt-2 text-center text-xs text-content-secondary opacity-70">
                Filed by {yesterdaySales.submitted_by
                  ? (await getProfileNameMap())[yesterdaySales.submitted_by] ?? "Staff"
                  : "Staff"}
                {" · "}{formatTimeIST(yesterdaySales.submitted_at)}
              </p>
            </>
          ) : (
            <p className="text-center text-xs text-content-secondary py-2">Sales not filed for yesterday</p>
          )}
        </div>
      )}
    </div>
  );
}

function MissingDatesBanner({ missing }: { missing: string[] }) {
  return (
    <div className="mb-4 rounded-2xl border-2 border-amber-400/40 bg-gradient-to-b from-amber-400/12 to-amber-500/4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-amber-400/20">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-400/20">
          <AlertTriangle className="size-4 text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-content-primary">
            {missing.length === 1
              ? "Sales missing for a previous date"
              : `Sales missing for ${missing.length} previous dates`}
          </p>
          <p className="text-xs text-content-secondary mt-0.5">Tap to file the missing data</p>
        </div>
      </div>
      {/* Date buttons */}
      <div className="px-4 py-3 space-y-2">
        {missing.map((d) => (
          <a
            key={d}
            href={`/sales?date=${d}`}
            className="flex w-full items-center justify-between rounded-xl bg-amber-400 px-4 py-3 text-sm font-bold text-amber-950 transition-all hover:bg-amber-300 active:scale-[0.98] shadow-sm shadow-amber-400/20"
          >
            <span>{formatDateLabel(d)}</span>
            <span className="flex items-center gap-1.5">
              File now
              <ArrowRight className="size-4" />
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

const CASH_CATEGORY_LABELS: Record<string, string> = {
  withdrawal: "Withdrawal",
  advance: "Advance",
  expense: "Expense",
  other: "Other",
};
const CASH_CATEGORY_COLORS: Record<string, string> = {
  withdrawal: "text-danger",
  advance: "text-warning",
  expense: "text-warm",
  other: "text-content-secondary",
};

function YesterdayCashRow({ entry }: { entry: CashExpense }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-content-primary">{entry.person_name}</p>
        <p className="text-xs text-content-secondary">
          <span className={CASH_CATEGORY_COLORS[entry.category] ?? "text-content-secondary"}>
            {CASH_CATEGORY_LABELS[entry.category] ?? entry.category}
          </span>
          {entry.notes && <> · {entry.notes}</>}
        </p>
      </div>
      <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-danger">
        -{formatINR(Number(entry.amount))}
      </span>
    </div>
  );
}
