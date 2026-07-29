import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth";
import {
  getClosingBalanceRange,
  getAttendanceStatusRange,
  getLeavesInRange,
  type ClosingBalanceDay,
} from "@/lib/data/reports";
import { formatINR } from "@/lib/utils";
import { APP_START_DATE } from "@/lib/constants";

function fmtDate(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}
function fmtDateCompact(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
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
  const dayCount = Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000) + 1;

  const wantsSales = sections.has("sales");
  const wantsClosing = sections.has("closing");
  const wantsCashout = sections.has("cashout");
  const wantsDaily = wantsSales || wantsClosing; // these two share one merged table
  const needsCombined = wantsDaily || wantsCashout;

  const [combined, attendance, leaves] = await Promise.all([
    needsCombined ? getClosingBalanceRange(from, to) : Promise.resolve([] as ClosingBalanceDay[]),
    sections.has("attendance") ? getAttendanceStatusRange(from, to) : Promise.resolve([]),
    sections.has("leaves") ? getLeavesInRange(from, to) : Promise.resolve([]),
  ]);
  // getClosingBalanceRange returns newest-first; reports read best oldest→newest.
  const daily = [...combined].reverse();

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

  // ── Summary KPI cards ────────────────────────────────────────────────────
  const totalSalesCash = daily.reduce((s, d) => s + d.salesCash, 0);
  const totalCashOut = daily.reduce((s, d) => s + d.cashOutTotal, 0);
  const lastWithClosing = [...daily].reverse().find((d) => d.closingCash != null);
  const daysWithDiscrepancy = daily.filter(
    (d) => (d.openingDiscrepancy != null && d.openingDiscrepancy !== 0) ||
           (d.closingDiscrepancyNotes && d.closingDiscrepancyNotes.trim() !== ""),
  ).length;

  const kpis: { label: string; value: string; tone?: string }[] = [];
  if (wantsSales) kpis.push({ label: "Total Cash Sales", value: formatINR(totalSalesCash) });
  if (wantsCashout) kpis.push({ label: "Total Cash-Out", value: formatINR(totalCashOut), tone: "neg" });
  if (wantsClosing) {
    kpis.push({ label: "Latest Closing Cash", value: lastWithClosing?.closingCash != null ? formatINR(lastWithClosing.closingCash) : "—" });
    kpis.push({ label: "Days with Discrepancy", value: String(daysWithDiscrepancy), tone: daysWithDiscrepancy > 0 ? "warn" : undefined });
  }

  const summaryHTML = kpis.length > 0 ? `
  <div class="kpi-row">
    ${kpis.map((k) => `
    <div class="kpi">
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-value ${k.tone ?? ""}">${k.value}</div>
    </div>`).join("")}
  </div>` : "";

  // ── Merged daily table (Sales + Closing Balance share one date column) ───
  let dailyHTML = "";
  if (wantsDaily) {
    const cols: string[] = ["Date"];
    if (wantsSales) cols.push("Cash Sales");
    if (wantsClosing) cols.push("Opening", "Closing", "Deposited");
    if (wantsCashout) cols.push("Cash-Out");
    if (wantsClosing) cols.push("Notes");

    dailyHTML = `
  <section>
    <div class="sec-header"><span class="sec-dot"></span>Daily Cash Summary</div>
    <div class="card">
      <table class="rpt">
        <thead><tr>${cols.map((c) => `<th class="${c === "Date" || c === "Notes" ? "" : "r"}">${c}</th>`).join("")}</tr></thead>
        <tbody>
          ${daily.map((d, i) => `
          <tr class="${i % 2 === 1 ? "alt" : ""}">
            <td class="strong">${fmtDateCompact(d.date)}</td>
            ${wantsSales ? `<td class="r">${d.salesCash > 0 ? formatINR(d.salesCash) : "—"}</td>` : ""}
            ${wantsClosing ? `
            <td class="r">${d.openingCash != null ? formatINR(d.openingCash) : "—"}</td>
            <td class="r">${d.closingCash != null ? formatINR(d.closingCash) : "—"}</td>
            <td class="r">${d.cashDeposited != null ? formatINR(d.cashDeposited) : "—"}</td>` : ""}
            ${wantsCashout ? `<td class="r ${d.cashOutTotal > 0 ? "neg" : ""}">${d.cashOutTotal > 0 ? formatINR(d.cashOutTotal) : "—"}</td>` : ""}
            ${wantsClosing ? `<td class="notes">${d.closingDiscrepancyNotes || d.openingDiscrepancyReason || ""}</td>` : ""}
          </tr>`).join("")}
        </tbody>
        <tfoot>
          <tr>
            <td>Total (${dayCount} days)</td>
            ${wantsSales ? `<td class="r">${formatINR(totalSalesCash)}</td>` : ""}
            ${wantsClosing ? `<td></td><td></td><td></td>` : ""}
            ${wantsCashout ? `<td class="r neg">${formatINR(totalCashOut)}</td>` : ""}
            ${wantsClosing ? `<td></td>` : ""}
          </tr>
        </tfoot>
      </table>
    </div>
  </section>`;
  }

  // ── Cash-out detail entries ───────────────────────────────────────────────
  let cashoutHTML = "";
  if (wantsCashout) {
    const allEntries = daily.flatMap((d) => d.cashOut);
    const net = allEntries.reduce((s, e) => s + (e.category === "deposit" ? -Number(e.amount) : Number(e.amount)), 0);
    cashoutHTML = `
  <section>
    <div class="sec-header"><span class="sec-dot"></span>Cash-Out Entries (${allEntries.length})</div>
    <div class="card">
      ${allEntries.length === 0 ? `<p class="empty">No cash-out entries in this period.</p>` : `
      <table class="rpt">
        <thead><tr><th>Date</th><th>Person / Purpose</th><th>Type</th><th>Notes</th><th class="r">Amount</th></tr></thead>
        <tbody>
          ${allEntries.map((e, i) => `
          <tr class="${i % 2 === 1 ? "alt" : ""}">
            <td class="strong">${fmtDateCompact(e.date)}</td>
            <td>${e.person_name}</td>
            <td><span class="pill">${e.category}</span></td>
            <td class="notes">${e.notes ?? ""}</td>
            <td class="r ${e.category === "deposit" ? "pos" : "neg"}">${e.category === "deposit" ? "+" : "-"}${formatINR(Number(e.amount))}</td>
          </tr>`).join("")}
        </tbody>
        <tfoot><tr><td colspan="4">Net Cash-Out</td><td class="r ${net >= 0 ? "neg" : "pos"}">${formatINR(net)}</td></tr></tfoot>
      </table>`}
    </div>
  </section>`;
  }

  // ── Attendance / checklist status ─────────────────────────────────────────
  let attendanceHTML = "";
  if (sections.has("attendance")) {
    const asc = [...attendance].reverse();
    attendanceHTML = `
  <section>
    <div class="sec-header"><span class="sec-dot"></span>Checklist Attendance Status</div>
    <div class="card">
      <table class="rpt">
        <thead><tr><th>Date</th><th class="c">Opening Filed</th><th class="c">Closing Filed</th></tr></thead>
        <tbody>
          ${asc.map((d, i) => `
          <tr class="${i % 2 === 1 ? "alt" : ""}">
            <td class="strong">${fmtDateCompact(d.date)}</td>
            <td class="c">${d.openingFiled ? `<span class="check">&#10003;</span>` : `<span class="dash">&#8212;</span>`}</td>
            <td class="c">${d.closingFiled ? `<span class="check">&#10003;</span>` : `<span class="dash">&#8212;</span>`}</td>
          </tr>`).join("")}
        </tbody>
      </table>
    </div>
  </section>`;
  }

  // ── Leaves ─────────────────────────────────────────────────────────────────
  let leavesHTML = "";
  if (sections.has("leaves")) {
    leavesHTML = `
  <section>
    <div class="sec-header"><span class="sec-dot"></span>Leave Requests (${leaves.length})</div>
    <div class="card">
      ${leaves.length === 0 ? `<p class="empty">No leave requests in this period.</p>` : `
      <table class="rpt">
        <thead><tr><th>Employee</th><th>Type</th><th>Dates</th><th>Status</th><th>Reason</th></tr></thead>
        <tbody>
          ${leaves.map((l, i) => `
          <tr class="${i % 2 === 1 ? "alt" : ""}">
            <td class="strong">${l.employeeName}</td>
            <td>${LEAVE_LABEL[l.leave_type] ?? l.leave_type}</td>
            <td>${fmtDate(l.start_date)}${l.start_date !== l.end_date ? ` &ndash; ${fmtDate(l.end_date)}` : ""}</td>
            <td><span class="pill ${l.status === "approved" ? "pill-ok" : l.status === "rejected" ? "pill-bad" : ""}">${l.status}</span></td>
            <td class="notes">${l.reason ?? ""}</td>
          </tr>`).join("")}
        </tbody>
      </table>`}
    </div>
  </section>`;
  }

  const rangeLabel = from === to ? fmtDate(from) : `${fmtDate(from)} to ${fmtDate(to)}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Business Report ${from} to ${to}</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  html{font-variant-numeric:tabular-nums;}
  body{font-family:'Poppins','Segoe UI',sans-serif;color:#1f2937;background:#f4f4f5;font-size:11.5px;line-height:1.4;}
  .page{max-width:900px;margin:0 auto;background:#ffffff;}

  .header{background:#111111;padding:26px 40px;display:flex;align-items:center;gap:18px;border-bottom:4px solid #eab308;}
  .logo{height:36px;}
  .co-name{font-size:15px;font-weight:700;color:#ffffff;letter-spacing:.4px;}
  .co-sub{font-size:9.5px;color:#ffffff;opacity:.7;margin-top:2px;}

  .title-block{padding:26px 40px 6px;}
  .title-block h1{font-size:19px;font-weight:800;letter-spacing:.3px;}
  .title-block p{font-size:11px;color:#6b7280;margin-top:5px;}

  .kpi-row{display:grid;grid-template-columns:repeat(${Math.max(kpis.length, 1)},1fr);gap:12px;padding:14px 40px 6px;}
  .kpi{border:1px solid #e5e7eb;border-radius:10px;padding:12px 14px;background:#fafafa;}
  .kpi-label{font-size:9px;text-transform:uppercase;letter-spacing:.5px;color:#6b7280;font-weight:600;}
  .kpi-value{font-size:18px;font-weight:800;color:#111827;margin-top:4px;}
  .kpi-value.neg{color:#b91c1c;}
  .kpi-value.warn{color:#b45309;}

  section{padding:0 40px;margin-top:22px;}
  .sec-header{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#111111;padding-bottom:8px;border-bottom:2px solid #111111;margin-bottom:10px;}
  .sec-dot{width:8px;height:8px;border-radius:2px;background:#eab308;display:inline-block;}

  .card{border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;}
  table.rpt{width:100%;border-collapse:collapse;font-size:10.8px;}
  table.rpt thead tr{background:#111111;}
  table.rpt th{color:#ffffff;text-align:left;padding:9px 12px;font-size:9.5px;font-weight:600;text-transform:uppercase;letter-spacing:.4px;}
  table.rpt td{padding:8px 12px;border-bottom:1px solid #f0f0f1;vertical-align:top;}
  table.rpt tr.alt{background:#fafafa;}
  table.rpt tr{page-break-inside:avoid;}
  table.rpt tfoot td{font-weight:700;background:#fafafa;border-top:2px solid #111111;border-bottom:none;padding:9px 12px;}
  table.rpt .r{text-align:right;}
  table.rpt .c{text-align:center;}
  table.rpt .strong{font-weight:600;color:#111827;white-space:nowrap;}
  table.rpt .notes{color:#6b7280;font-size:10px;}
  table.rpt .pos{color:#15803d;font-weight:600;}
  table.rpt .neg{color:#b91c1c;font-weight:600;}
  .pill{display:inline-block;padding:2px 8px;border-radius:999px;background:#eef2f7;color:#374151;font-size:9.5px;text-transform:capitalize;font-weight:600;}
  .pill-ok{background:#dcfce7;color:#166534;}
  .pill-bad{background:#fee2e2;color:#991b1b;}
  .check{color:#15803d;font-weight:700;}
  .dash{color:#d1d5db;}
  .empty{padding:20px;text-align:center;color:#9ca3af;font-size:11px;}

  .footer{margin:34px 0 0;padding:14px 40px 30px;font-size:9px;color:#9ca3af;border-top:1px solid #e5e7eb;}

  @media print{
    body{background:#ffffff;}
    .page{max-width:none;}
    section{page-break-inside:auto;}
    thead{display:table-header-group;}
    tfoot{display:table-row-group;}
    @page{margin:14mm 10mm;}
    body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    ${logoBase64 ? `<img src="${logoBase64}" class="logo" alt="Brick and Clay">` : `<strong style="color:#fff;font-size:18px;">BRICK &amp; CLAY</strong>`}
    <div>
      <div class="co-name">SS BRICK AND CLAY PRIVATE LIMITED</div>
      <div class="co-sub">CIN: U52590OR2022PTC040271</div>
    </div>
  </div>

  <div class="title-block">
    <h1>Business Report</h1>
    <p>${rangeLabel} &middot; ${dayCount} day${dayCount === 1 ? "" : "s"} &middot; Generated ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
  </div>

  ${summaryHTML}
  ${dailyHTML}
  ${cashoutHTML}
  ${attendanceHTML}
  ${leavesHTML}

  <div class="footer">SS Brick and Clay Private Limited &middot; Generated from the Operations Platform &middot; For internal use only</div>
</div>
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
