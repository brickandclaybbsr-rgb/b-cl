import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth";
import { getSalesRange, salesTotal } from "@/lib/data/sales";
import {
  getClosingBalanceRange,
  getAttendanceStatusRange,
  getLeavesInRange,
} from "@/lib/data/reports";
import { formatINR } from "@/lib/utils";
import { APP_START_DATE } from "@/lib/constants";

function fmtDate(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

const LEAVE_LABEL: Record<string, string> = { cl: "Weekly Off / CL", sl: "Sick Leave", lwp: "Leave Without Pay" };

export async function GET(req: NextRequest) {
  try {
    await requireOwner();
  } catch {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const fromRaw = searchParams.get("from") ?? "";
  const toRaw = searchParams.get("to") ?? "";
  const from = (fromRaw >= APP_START_DATE && fromRaw <= today) ? fromRaw : APP_START_DATE;
  const to = (toRaw >= from && toRaw <= today) ? toRaw : today;
  const sections = new Set((searchParams.get("sections") ?? "sales,cashout,closing").split(","));

  const needsCombined = sections.has("sales") || sections.has("cashout") || sections.has("closing");
  const [combined, attendance, leaves] = await Promise.all([
    needsCombined ? getClosingBalanceRange(from, to) : Promise.resolve([]),
    sections.has("attendance") ? getAttendanceStatusRange(from, to) : Promise.resolve([]),
    sections.has("leaves") ? getLeavesInRange(from, to) : Promise.resolve([]),
  ]);

  // Logo (embedded so the report renders identically everywhere, matching payslips).
  let logoBase64 = "";
  try {
    const fs = require("fs");
    const path = require("path");
    const logoPath = path.join(process.cwd(), "Assets", "Brick & Clay White Full Logo.png");
    if (fs.existsSync(logoPath)) {
      logoBase64 = `data:image/png;base64,${fs.readFileSync(logoPath).toString("base64")}`;
    }
  } catch {
    logoBase64 = "";
  }

  // ── Sales section ────────────────────────────────────────────────────────
  let salesHTML = "";
  if (sections.has("sales")) {
    const periodTotal = combined.reduce((s, d) => s + d.salesCash, 0);
    salesHTML = `
    <div class="sec-title">Daily Sales (Cash)</div>
    <table class="rpt">
      <thead><tr><th>Date</th><th class="r">Cash Sales</th></tr></thead>
      <tbody>
        ${combined.map((d) => `<tr><td>${fmtDate(d.date)}</td><td class="r">${formatINR(d.salesCash)}</td></tr>`).join("")}
      </tbody>
      <tfoot><tr><td>Total</td><td class="r">${formatINR(periodTotal)}</td></tr></tfoot>
    </table>`;
  }

  // ── Cash-out section ─────────────────────────────────────────────────────
  let cashoutHTML = "";
  if (sections.has("cashout")) {
    const allEntries = combined.flatMap((d) => d.cashOut);
    const total = allEntries.reduce((s, e) => s + (e.category === "deposit" ? -Number(e.amount) : Number(e.amount)), 0);
    cashoutHTML = `
    <div class="sec-title">Cash-Out Entries</div>
    <table class="rpt">
      <thead><tr><th>Date</th><th>Person / Purpose</th><th>Type</th><th>Notes</th><th class="r">Amount</th></tr></thead>
      <tbody>
        ${allEntries.length === 0 ? `<tr><td colspan="5" class="muted">No cash-out entries in this period.</td></tr>` : ""}
        ${allEntries.map((e) => `
        <tr>
          <td>${fmtDate(e.date)}</td>
          <td>${e.person_name}</td>
          <td>${e.category}</td>
          <td>${e.notes ?? ""}</td>
          <td class="r ${e.category === "deposit" ? "pos" : "neg"}">${e.category === "deposit" ? "+" : "-"}${formatINR(Number(e.amount))}</td>
        </tr>`).join("")}
      </tbody>
      <tfoot><tr><td colspan="4">Net Cash-Out</td><td class="r">${formatINR(total)}</td></tr></tfoot>
    </table>`;
  }

  // ── Closing balance section ──────────────────────────────────────────────
  let closingHTML = "";
  if (sections.has("closing")) {
    closingHTML = `
    <div class="sec-title">Closing Balance</div>
    <table class="rpt">
      <thead><tr><th>Date</th><th class="r">Opening</th><th class="r">Closing</th><th class="r">Deposited</th><th>Notes</th></tr></thead>
      <tbody>
        ${combined.map((d) => `
        <tr>
          <td>${fmtDate(d.date)}</td>
          <td class="r">${d.openingCash != null ? formatINR(d.openingCash) : "—"}</td>
          <td class="r">${d.closingCash != null ? formatINR(d.closingCash) : "—"}</td>
          <td class="r">${d.cashDeposited != null ? formatINR(d.cashDeposited) : "—"}</td>
          <td>${d.closingDiscrepancyNotes ?? (d.openingDiscrepancyReason ?? "")}</td>
        </tr>`).join("")}
      </tbody>
    </table>`;
  }

  // ── Attendance / checklist status section ────────────────────────────────
  let attendanceHTML = "";
  if (sections.has("attendance")) {
    attendanceHTML = `
    <div class="sec-title">Checklist Attendance Status</div>
    <table class="rpt">
      <thead><tr><th>Date</th><th class="c">Opening Filed</th><th class="c">Closing Filed</th></tr></thead>
      <tbody>
        ${attendance.map((d) => `
        <tr>
          <td>${fmtDate(d.date)}</td>
          <td class="c">${d.openingFiled ? "✓" : "—"}</td>
          <td class="c">${d.closingFiled ? "✓" : "—"}</td>
        </tr>`).join("")}
      </tbody>
    </table>`;
  }

  // ── Leaves section ────────────────────────────────────────────────────────
  let leavesHTML = "";
  if (sections.has("leaves")) {
    leavesHTML = `
    <div class="sec-title">Leave Requests</div>
    <table class="rpt">
      <thead><tr><th>Employee</th><th>Type</th><th>Dates</th><th>Status</th><th>Reason</th></tr></thead>
      <tbody>
        ${leaves.length === 0 ? `<tr><td colspan="5" class="muted">No leave requests in this period.</td></tr>` : ""}
        ${leaves.map((l) => `
        <tr>
          <td>${l.employeeName}</td>
          <td>${LEAVE_LABEL[l.leave_type] ?? l.leave_type}</td>
          <td>${fmtDate(l.start_date)}${l.start_date !== l.end_date ? ` – ${fmtDate(l.end_date)}` : ""}</td>
          <td class="cap">${l.status}</td>
          <td>${l.reason ?? ""}</td>
        </tr>`).join("")}
      </tbody>
    </table>`;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Business Report — ${fmtDate(from)} to ${fmtDate(to)}</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Poppins','Segoe UI',sans-serif;color:#1a1a1a;background:#ffffff;font-size:12px;padding:0 0 40px;}
  .header{background:#111111;padding:22px 40px;display:flex;align-items:center;gap:18px;border-bottom:4px solid #eab308;}
  .logo{height:38px;}
  .co-name{font-size:16px;font-weight:700;color:#ffffff;letter-spacing:.5px;}
  .co-sub{font-size:10px;color:#ffffff;opacity:.75;margin-top:2px;}
  .title-block{padding:24px 40px 8px;}
  .title-block h1{font-size:18px;font-weight:800;text-transform:uppercase;letter-spacing:1px;}
  .title-block p{font-size:11px;color:#6b7280;margin-top:4px;}
  .sec-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#111111;border-bottom:2px solid #111111;padding:24px 40px 6px;margin:0;}
  table.rpt{width:calc(100% - 80px);margin:8px 40px 0;border-collapse:collapse;font-size:11px;}
  table.rpt th{background:#111111;color:#fff;text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.4px;}
  table.rpt td{padding:7px 10px;border-bottom:1px solid #e5e7eb;}
  table.rpt tfoot td{font-weight:700;border-top:2px solid #111111;border-bottom:none;}
  table.rpt .r{text-align:right;font-family:monospace;}
  table.rpt .c{text-align:center;}
  table.rpt .cap{text-transform:capitalize;}
  table.rpt .pos{color:#15803d;}
  table.rpt .neg{color:#b91c1c;}
  table.rpt .muted{color:#9ca3af;text-align:center;padding:16px;}
  .footer{margin:30px 40px 0;font-size:9px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:10px;}
  @media print{ body{-webkit-print-color-adjust:exact;print-color-adjust:exact;} }
</style>
</head>
<body>
  <div class="header">
    ${logoBase64 ? `<img src="${logoBase64}" class="logo" alt="Brick and Clay">` : `<strong style="color:#fff;font-size:18px;">BRICK &amp; CLAY</strong>`}
    <div>
      <div class="co-name">SS BRICK AND CLAY PRIVATE LIMITED</div>
      <div class="co-sub">CIN: U52590OR2022PTC040271</div>
    </div>
  </div>
  <div class="title-block">
    <h1>Business Report</h1>
    <p>${fmtDate(from)} &ndash; ${fmtDate(to)} &middot; Generated ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
  </div>

  ${salesHTML}
  ${cashoutHTML}
  ${closingHTML}
  ${attendanceHTML}
  ${leavesHTML}

  <div class="footer">SS Brick and Clay Private Limited &middot; Generated from the Operations Platform &middot; For internal use only</div>
  <script>window.onload = () => { window.print(); };</script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-cache",
    },
  });
}
