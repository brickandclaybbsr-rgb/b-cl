/**
 * Salary slip document — one minimal, print-ready A4 page laid out as tables.
 *
 * A pure function of its input, with no server dependencies: the app's live
 * payslip (generatePayslipInternal in app/(app)/attendance/actions-hr.ts) and
 * offline scripts that print slips for staff outside the app both render
 * through here, so every slip the business hands out looks the same.
 *
 * Type: Poppins for text, Gilroy ExtraBold for headings. Both are tried as
 * locally installed fonts first (so PDFs printed on the office PC don't wait
 * on the network); Poppins then falls back to Google Fonts. Gilroy is never
 * served from here — its licence covers embedding in documents (PDFs), not
 * web serving — so devices without it installed show Poppins headings.
 */

export type PayslipDayKind = "present" | "leave" | "unpaid" | "other" | "none";

export interface PayslipLine {
  label: string;
  /** Basis shown under the label, e.g. "3 days × ₹1,000.00". */
  detail?: string;
  amount: number;
}

export interface PayslipData {
  period: string;                     // "September 2026"
  /** Shown after "Salary Slip", e.g. "Final Settlement". */
  title?: string;
  status: "draft" | "final";
  employee: {
    name: string;
    code?: string | null;
    designation?: string | null;
    department?: string | null;
    outlet?: string | null;
    joined?: string | null;           // yyyy-MM-dd
    pan?: string | null;
    aadhar?: string | null;           // printed masked to the last four digits
  };
  /** Headline attendance figures, left to right. */
  attendance: Array<{ label: string; value: number | string }>;
  earnings: PayslipLine[];
  deductions: PayslipLine[];
  net: number;
  notes?: string[];
  payment?: { date: string; mode: string; reference: string; amount: number };
  /** Day-by-day marks. Omit when the totals were set by hand, so the page never contradicts itself. */
  calendar?: {
    /** Blank cells before day 1 in a Monday-first week. */
    leadingBlanks: number;
    days: Array<{ dayNum: number; label: string; kind: PayslipDayKind }>;
  };
  signatory: { name: string; title: string; signature?: string; stamp?: string };
  /** White-on-transparent logo; printed black. */
  logo?: string;
}

export const COMPANY = {
  name: "SS Brick and Clay Private Limited",
  address: "Plot No. A-17/13, Unit-7, Surya Nagar, Bhubaneswar, Odisha 751003",
  cin: "U52590OR2022PTC040271",
};

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export const formatINR = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (d: string) => {
  const t = new Date(d + "T00:00:00");
  return isNaN(t.getTime()) ? d : t.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const maskAadhar = (a: string) => {
  const digits = a.replace(/\D/g, "");
  return digits.length >= 4 ? `XXXX XXXX ${digits.slice(-4)}` : a;
};

/** Whole rupees in Indian-system words: 27000 → "Twenty-Seven Thousand". */
export function rupeesInWords(amount: number): string {
  const n = Math.floor(Math.max(0, amount));
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
    "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const two = (x: number) => (x < 20 ? ones[x] : tens[Math.floor(x / 10)] + (x % 10 ? "-" + ones[x % 10] : ""));
  const three = (x: number) =>
    x >= 100 ? `${ones[Math.floor(x / 100)]} Hundred${x % 100 ? " " + two(x % 100) : ""}` : two(x);
  if (n === 0) return "Zero";
  const parts: string[] = [];
  const crore = Math.floor(n / 1e7), lakh = Math.floor((n % 1e7) / 1e5), thousand = Math.floor((n % 1e5) / 1e3);
  if (crore) parts.push(`${two(crore)} Crore`);
  if (lakh) parts.push(`${two(lakh)} Lakh`);
  if (thousand) parts.push(`${two(thousand)} Thousand`);
  if (n % 1000) parts.push(three(n % 1000));
  return parts.join(" ");
}

const STYLE = `
@font-face{font-family:"Gilroy";font-weight:800;src:local("Gilroy ExtraBold"),local("Gilroy-ExtraBold")}
@font-face{font-family:"Poppins Local";font-weight:400;src:local("Poppins Regular"),local("Poppins-Regular")}
@font-face{font-family:"Poppins Local";font-weight:500;src:local("Poppins Medium"),local("Poppins-Medium")}
@font-face{font-family:"Poppins Local";font-weight:600;src:local("Poppins SemiBold"),local("Poppins-SemiBold")}
@page{size:A4;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:"Poppins Local","Poppins","Segoe UI",Arial,sans-serif;color:#111827;background:#fff;font-size:10.5px;line-height:1.5;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.sheet{width:100%;max-width:210mm;min-height:296mm;margin:0 auto;padding:15mm 16mm 11mm;display:flex;flex-direction:column}
.head{font-family:"Gilroy","Poppins Local","Poppins",sans-serif;font-weight:800}
.num{font-variant-numeric:tabular-nums;white-space:nowrap}
header{display:flex;justify-content:space-between;align-items:flex-end;gap:24px}
.logo{height:26px;filter:invert(1)}
.brand-text{font-size:15px;letter-spacing:.04em}
.doc{text-align:right}
.doc h1{font-size:20px;letter-spacing:.02em;line-height:1.1}
.doc .period{font-size:11px;color:#6b7280;margin-top:3px}
.tag{display:inline-block;margin-left:8px;padding:1px 8px;border:1px solid #d1d5db;border-radius:99px;font-family:"Poppins Local","Poppins",sans-serif;font-size:8.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;vertical-align:4px}
.company{margin-top:10px;padding-bottom:12px;border-bottom:1px solid #e5e7eb;font-size:9px;color:#6b7280}
h2{font-size:11.5px;margin:18px 0 7px;letter-spacing:.01em}
table{width:100%;border-collapse:collapse;table-layout:fixed}
th,td{border:1px solid #e5e7eb;padding:6px 9px;text-align:left;vertical-align:top}
thead th,.kv th{background:#f9fafb;color:#6b7280;font-weight:500;font-size:9.5px}
.kv td{font-weight:500}
.att th,.att td{text-align:center}
.att td{font-size:13px;font-weight:600;padding:7px 9px}
.amt{text-align:right}
.pay td .d{display:block;font-size:9px;color:#6b7280}
.pay tfoot td{font-weight:600;background:#f9fafb}
.pay tr.net td{background:#111827;color:#fff;border-color:#111827;font-size:12px;padding:9px}
.pay tr.net td.amt{font-family:"Gilroy","Poppins Local","Poppins",sans-serif;font-weight:800;font-size:17px;letter-spacing:.01em}
.pay tr.words td{background:#fff;font-weight:400;color:#374151}
.notes{margin-top:10px;font-size:9.5px;color:#6b7280}
.notes p+p{margin-top:2px}
.paid td{font-weight:500}
.cal td{height:30px;padding:3px 6px;font-size:9px}
.cal td .n{color:#9ca3af}
.cal td .l{float:right;font-weight:600}
.cal td.present .l{color:#9ca3af;font-weight:400}
.cal td.unpaid{background:#f3f4f6}
.cal td.blank{background:#fcfcfd}
.legend{font-size:9px;color:#6b7280;margin-top:5px}
footer{margin-top:auto;padding-top:24px}
.sign{display:flex;justify-content:space-between;align-items:flex-end}
.sig{width:42%;font-size:10.5px}
.sig .space{height:52px;display:flex;align-items:flex-end;gap:10px}
.sig .space img.s{max-height:46px;max-width:150px;object-fit:contain}
.sig .space img.st{max-height:52px;max-width:120px;object-fit:contain;opacity:.9}
.sig .line{border-top:1px solid #111827;padding-top:5px;font-weight:500}
.sig .t{color:#6b7280;font-size:9px;font-weight:400}
.sig.right{text-align:right}
.sig.right .space{justify-content:flex-end}
.fine{margin-top:14px;font-size:8.5px;color:#9ca3af;text-align:center}
@media (max-width:640px){.sheet{padding:18px 12px;min-height:0}th,td{padding:5px 6px}.kv th,.kv td{font-size:9.5px}}
`;

export function renderPayslipHtml(d: PayslipData): string {
  const e = d.employee;

  // Employee details as label/value pairs, two pairs to a row.
  const facts: Array<[string, string]> = [["Employee name", esc(e.name)]];
  if (e.code) facts.push(["Employee code", esc(e.code)]);
  if (e.designation) facts.push(["Designation", esc(e.designation)]);
  if (e.department) facts.push(["Department", esc(e.department)]);
  if (e.outlet) facts.push(["Outlet", esc(e.outlet)]);
  if (e.joined) facts.push(["Date of joining", esc(formatDate(e.joined))]);
  if (e.pan) facts.push(["PAN", esc(e.pan)]);
  if (e.aadhar) facts.push(["Aadhaar", esc(maskAadhar(e.aadhar))]);
  facts.push(["Pay period", esc(d.period)]);
  if (facts.length % 2) facts.push(["", ""]);
  const factRows: string[] = [];
  for (let i = 0; i < facts.length; i += 2) {
    factRows.push(`<tr>${facts.slice(i, i + 2).map(([k, v]) => `<th>${k}</th><td>${v}</td>`).join("")}</tr>`);
  }

  // Earnings beside deductions, row by row.
  const cell = (l?: PayslipLine) =>
    l ? `<td>${esc(l.label)}${l.detail ? `<span class="d">${esc(l.detail)}</span>` : ""}</td>` : "<td></td>";
  const amount = (l?: PayslipLine) => `<td class="amt num">${l ? formatINR(l.amount) : ""}</td>`;
  const deductions = d.deductions.length ? d.deductions : [{ label: "None", amount: 0 }];
  const payRows: string[] = [];
  for (let i = 0; i < Math.max(d.earnings.length, deductions.length); i++) {
    payRows.push(`<tr>${cell(d.earnings[i])}${amount(d.earnings[i])}${cell(deductions[i])}${amount(deductions[i])}</tr>`);
  }
  const totalEarnings = d.earnings.reduce((t, l) => t + l.amount, 0);
  const totalDeductions = d.deductions.reduce((t, l) => t + l.amount, 0);

  let calendar = "";
  if (d.calendar) {
    const cells = [
      ...Array.from({ length: d.calendar.leadingBlanks }, () => `<td class="blank"></td>`),
      ...d.calendar.days.map((c) => `<td class="${c.kind}"><span class="n">${c.dayNum}</span><span class="l">${esc(c.label)}</span></td>`),
    ];
    while (cells.length % 7) cells.push(`<td class="blank"></td>`);
    const weeks: string[] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(`<tr>${cells.slice(i, i + 7).join("")}</tr>`);
    calendar = `<h2 class="head">Daily attendance</h2>
  <table class="cal">
    <thead><tr>${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((w) => `<th>${w}</th>`).join("")}</tr></thead>
    <tbody>${weeks.join("")}</tbody>
  </table>
  <div class="legend">P present · CL weekly off / leave · SL sick leave · LWP unpaid</div>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Salary Slip — ${esc(e.name)} — ${esc(d.period)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap">
<style>${STYLE}</style>
</head>
<body>
<main class="sheet">
  <header>
    ${d.logo ? `<img class="logo" src="${d.logo}" alt="Brick &amp; Clay">` : `<div class="brand-text head">BRICK &amp; CLAY</div>`}
    <div class="doc">
      <h1 class="head">SALARY SLIP${d.title ? ` · ${esc(d.title.toUpperCase())}` : ""}${d.status === "draft" ? `<span class="tag">Draft</span>` : ""}</h1>
      <div class="period">${esc(d.period)}</div>
    </div>
  </header>
  <div class="company">${esc(COMPANY.name)} · ${esc(COMPANY.address)} · CIN ${esc(COMPANY.cin)}</div>

  <h2 class="head">Employee details</h2>
  <table class="kv">
    <colgroup><col style="width:17%"><col style="width:33%"><col style="width:17%"><col style="width:33%"></colgroup>
    <tbody>${factRows.join("")}</tbody>
  </table>

  <h2 class="head">Attendance</h2>
  <table class="att">
    <thead><tr>${d.attendance.map((a) => `<th>${esc(a.label)}</th>`).join("")}</tr></thead>
    <tbody><tr>${d.attendance.map((a) => `<td class="num">${esc(a.value)}</td>`).join("")}</tr></tbody>
  </table>

  <h2 class="head">Earnings &amp; deductions</h2>
  <table class="pay">
    <colgroup><col style="width:31%"><col style="width:19%"><col style="width:31%"><col style="width:19%"></colgroup>
    <thead><tr><th>Earnings</th><th class="amt">Amount</th><th>Deductions</th><th class="amt">Amount</th></tr></thead>
    <tbody>${payRows.join("")}</tbody>
    <tfoot>
      <tr><td>Gross earnings</td><td class="amt num">${formatINR(totalEarnings)}</td><td>Total deductions</td><td class="amt num">${formatINR(totalDeductions)}</td></tr>
      <tr class="net"><td colspan="3">Net pay</td><td class="amt num">${formatINR(d.net)}</td></tr>
      <tr class="words"><td colspan="4">Rupees ${rupeesInWords(d.net)} Only</td></tr>
    </tfoot>
  </table>

  ${d.payment ? `<h2 class="head">Payment</h2>
  <table class="paid">
    <thead><tr><th>Paid on</th><th>Mode</th><th>Reference</th><th class="amt">Amount paid</th></tr></thead>
    <tbody><tr><td>${esc(formatDate(d.payment.date))}</td><td>${esc(d.payment.mode)}</td><td>${esc(d.payment.reference)}</td><td class="amt num">${formatINR(d.payment.amount)}</td></tr></tbody>
  </table>` : ""}
  ${d.notes?.length ? `<div class="notes">${d.notes.map((n) => `<p>${esc(n)}</p>`).join("")}</div>` : ""}

  ${calendar}

  <footer>
    <div class="sign">
      <div class="sig"><div class="space"></div><div class="line">${esc(e.name)}<div class="t">Employee</div></div></div>
      <div class="sig right">
        <div class="space">
          ${d.signatory.stamp ? `<img class="st" src="${d.signatory.stamp}" alt="Company stamp">` : ""}
          ${d.signatory.signature ? `<img class="s" src="${d.signatory.signature}" alt="Signature">` : ""}
        </div>
        <div class="line">${esc(d.signatory.name)}<div class="t">${esc(d.signatory.title)}, for ${esc(COMPANY.name)}</div></div>
      </div>
    </div>
    <div class="fine">Computer-generated salary slip. No tax or PF has been deducted for this period.</div>
  </footer>
</main>
</body>
</html>`;
}
