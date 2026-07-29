import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { ExportReportClient } from "./export-report-client";

export const metadata = { title: "Export Report" };

export default async function ExportReportPage() {
  await requireOwner();

  return (
    <div className="container mx-auto max-w-2xl space-y-5 pb-16">
      <div className="flex items-center gap-3 pt-1">
        <Link
          href="/reports"
          className="rounded-lg p-1.5 text-content-secondary transition-colors hover:bg-bg-elevated hover:text-content-primary"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-content-primary">Export Report</h1>
          <p className="text-xs text-content-secondary">
            Pick a date range and exactly what to include, then download as PDF.
          </p>
        </div>
      </div>

      <ExportReportClient />
    </div>
  );
}
