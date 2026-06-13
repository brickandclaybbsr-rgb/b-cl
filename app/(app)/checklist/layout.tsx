import Link from "next/link";
import { LineChart, ClipboardCheck } from "lucide-react";

export default function ChecklistLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {/* Section switcher — mirrors the Reports page tab row */}
      <div className="mb-4 flex gap-1 border-b border-border pb-px">
        <Link
          href="/reports"
          className="flex items-center gap-1.5 pb-3 px-3 text-sm font-semibold text-content-secondary hover:text-content-primary transition-colors"
        >
          <LineChart className="size-4" /> Reports
        </Link>
        <Link
          href="/checklist/opening"
          className="relative flex items-center gap-1.5 pb-3 text-sm font-semibold text-white after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-white"
        >
          <ClipboardCheck className="size-4" /> Checklist
        </Link>
      </div>
      {children}
    </div>
  );
}
