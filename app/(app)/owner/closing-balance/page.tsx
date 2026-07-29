import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { getClosingBalanceForDate, getClosingBalanceRange } from "@/lib/data/reports";
import { todayIST, daysAgoIST } from "@/lib/date";
import { APP_START_DATE } from "@/lib/constants";
import { ClosingBalanceClient } from "./closing-balance-client";

export const metadata = { title: "Closing Balance Report" };

export default async function ClosingBalancePage({
  searchParams,
}: {
  searchParams: { date?: string; days?: string };
}) {
  await requireOwner();

  const today = todayIST();
  const rawDate = String(searchParams.date ?? "").trim();
  const date = (rawDate >= APP_START_DATE && rawDate <= today) ? rawDate : daysAgoIST(1);

  const rawDays = parseInt(String(searchParams.days ?? "30"), 10);
  const rangeDays = [7, 14, 30, 60, 90].includes(rawDays) ? rawDays : 30;
  const rangeFrom = daysAgoIST(rangeDays - 1);

  const [selectedDay, range] = await Promise.all([
    getClosingBalanceForDate(date),
    getClosingBalanceRange(rangeFrom, today),
  ]);

  return (
    <div className="container mx-auto max-w-4xl space-y-5 pb-16">
      <div className="flex items-center gap-3 pt-1">
        <Link
          href="/reports"
          className="rounded-lg p-1.5 text-content-secondary transition-colors hover:bg-bg-elevated hover:text-content-primary"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-content-primary">Closing Balance Report</h1>
          <p className="text-xs text-content-secondary">
            Opening/closing cash, deposits, discrepancies, and cash-outs for any date.
          </p>
        </div>
        <Link
          href="/owner/export-report"
          className="shrink-0 rounded-lg bg-white px-3 py-2 text-xs font-bold text-black transition-opacity hover:opacity-90"
        >
          Export PDF
        </Link>
      </div>

      <ClosingBalanceClient
        selectedDate={date}
        selectedDay={selectedDay}
        range={range}
        rangeDays={rangeDays}
        today={today}
      />
    </div>
  );
}
