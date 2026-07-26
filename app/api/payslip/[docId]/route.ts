import { NextRequest, NextResponse } from "next/server";
import { renderLivePayslip } from "@/app/(app)/attendance/actions-hr";

/**
 * Serves a payslip rendered LIVE from current data (profile, advances, payment
 * details) — never a stale stored snapshot. Access control lives in
 * renderLivePayslip (owner sees all; staff only their own visible slip).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { docId: string } },
) {
  try {
    const { html, error, status } = await renderLivePayslip(params.docId);

    if (error || !html) {
      return new NextResponse(error || "Payslip not available", { status: status ?? 500 });
    }

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": "inline",
        "Cache-Control": "private, no-cache",
      },
    });
  } catch {
    return new NextResponse("Internal server error", { status: 500 });
  }
}
