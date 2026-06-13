import XLSX from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const wb = XLSX.readFile(path.join(__dirname, "..", "Assets", "CLOSING BALANCE 2026.xlsx"));

// Column positions (0-indexed)
const COL = {
  label:      0,
  cash:       1,
  card:       3,
  upi:        5,
  zo_goid:    7,
  zomato:     9,
  swiggy:     11,
  swiggy_din: 13,
  eazy_diner: 15,
};

function num(ws, r, c) {
  const cell = ws[XLSX.utils.encode_cell({ r, c })];
  if (!cell) return 0;
  const v = parseFloat(String(cell.v ?? "").replace(/,/g, ""));
  return isNaN(v) ? 0 : v;
}
function str(ws, r, c) {
  const cell = ws[XLSX.utils.encode_cell({ r, c })];
  return cell ? String(cell.v ?? "").trim() : "";
}

const days = [];

for (const sheetName of wb.SheetNames) {
  const ws = wb.Sheets[sheetName];
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");

  // R2 (index 1): OPENING CASH row — platforms sometimes entered here
  // R3 (index 2): CASH SALE row — platforms sometimes entered here
  const openingCash = num(ws, 1, COL.cash);
  const cashSale    = num(ws, 2, COL.cash);

  // Platform sales: combine R2 + R3 (whoever has the value wins)
  function platformVal(col) {
    return num(ws, 1, col) || num(ws, 2, col);
  }
  const card       = platformVal(COL.card);
  const upi        = platformVal(COL.upi);
  const zoGoid     = platformVal(COL.zo_goid);
  const zomato     = platformVal(COL.zomato);
  const swiggy     = platformVal(COL.swiggy);
  const swiggyDin  = platformVal(COL.swiggy_din);
  const eazyDiner  = platformVal(COL.eazy_diner);

  // R4–R20: cash expenses
  const expenses = [];
  for (let r = 3; r <= Math.min(range.e.r - 1, 19); r++) {
    const label  = str(ws, r, COL.label);
    const amount = num(ws, r, COL.cash);
    if (label && amount > 0) expenses.push({ label, amount });
  }

  // R21 (index 20): CLOSING BALANCE
  const closingBalance = num(ws, 20, COL.cash);

  const totalOnline    = card + upi + zoGoid + zomato + swiggy + swiggyDin + eazyDiner;
  const totalSale      = cashSale + totalOnline;
  const totalExpenses  = expenses.reduce((s, e) => s + e.amount, 0);

  // Skip empty days
  if (totalSale === 0 && openingCash === 0) continue;

  days.push({
    date: sheetName,
    openingCash, cashSale, card, upi, zoGoid, zomato,
    swiggy, swiggyDin, eazyDiner,
    totalOnline, totalSale, expenses, totalExpenses, closingBalance,
  });
}

// ── Daily Report ────────────────────────────────────────────────────────────
console.log(`\n${"═".repeat(72)}`);
console.log(`  CLOSING BALANCE — DAILY REPORT  (June 2026)`);
console.log(`${"═".repeat(72)}`);
console.log(
  `  ${"Date".padEnd(13)} ${"Open".padStart(6)} ${"CashSale".padStart(9)} ${"Online".padStart(8)} ${"TotalSale".padStart(10)} ${"Expenses".padStart(9)} ${"Closing".padStart(8)}`
);
console.log(`  ${"─".repeat(68)}`);

for (const d of days) {
  console.log(
    `  ${d.date.padEnd(13)} ${String(d.openingCash).padStart(6)} ${String(d.cashSale).padStart(9)} ${String(d.totalOnline).padStart(8)} ${String(d.totalSale).padStart(10)} ${String(d.totalExpenses).padStart(9)} ${String(d.closingBalance).padStart(8)}`
  );
}

// ── Platform Breakdown ───────────────────────────────────────────────────────
console.log(`\n${"═".repeat(72)}`);
console.log(`  SALES BY PLATFORM`);
console.log(`${"═".repeat(72)}`);
console.log(
  `  ${"Date".padEnd(13)} ${"Cash".padStart(6)} ${"Card".padStart(6)} ${"UPI".padStart(7)} ${"ZoGoId".padStart(7)} ${"Zomato".padStart(7)} ${"Swiggy".padStart(7)} ${"SwgDin".padStart(7)} ${"Eazy".padStart(6)}`
);
console.log(`  ${"─".repeat(68)}`);
for (const d of days) {
  console.log(
    `  ${d.date.padEnd(13)} ${String(d.cashSale).padStart(6)} ${String(d.card).padStart(6)} ${String(d.upi).padStart(7)} ${String(d.zoGoid).padStart(7)} ${String(d.zomato).padStart(7)} ${String(d.swiggy).padStart(7)} ${String(d.swiggyDin).padStart(7)} ${String(d.eazyDiner).padStart(6)}`
  );
}

// ── Totals ────────────────────────────────────────────────────────────────────
const totCash    = days.reduce((s, d) => s + d.cashSale, 0);
const totCard    = days.reduce((s, d) => s + d.card, 0);
const totUPI     = days.reduce((s, d) => s + d.upi, 0);
const totZoGoid  = days.reduce((s, d) => s + d.zoGoid, 0);
const totZomato  = days.reduce((s, d) => s + d.zomato, 0);
const totSwiggy  = days.reduce((s, d) => s + d.swiggy, 0);
const totSwgDin  = days.reduce((s, d) => s + d.swiggyDin, 0);
const totEazy    = days.reduce((s, d) => s + d.eazyDiner, 0);
const totOnline  = days.reduce((s, d) => s + d.totalOnline, 0);
const totSale    = days.reduce((s, d) => s + d.totalSale, 0);
const totExp     = days.reduce((s, d) => s + d.totalExpenses, 0);

console.log(`  ${"─".repeat(68)}`);
console.log(
  `  ${"TOTAL".padEnd(13)} ${String(totCash).padStart(6)} ${String(totCard).padStart(6)} ${String(totUPI).padStart(7)} ${String(totZoGoid).padStart(7)} ${String(totZomato).padStart(7)} ${String(totSwiggy).padStart(7)} ${String(totSwgDin).padStart(7)} ${String(totEazy).padStart(6)}`
);

// ── Cash Expenses Breakdown ───────────────────────────────────────────────────
const expenseMap = {};
for (const d of days) {
  for (const e of d.expenses) {
    const key = e.label.toUpperCase().trim();
    expenseMap[key] = (expenseMap[key] || 0) + e.amount;
  }
}
const sortedExp = Object.entries(expenseMap).sort((a, b) => b[1] - a[1]);

console.log(`\n${"═".repeat(72)}`);
console.log(`  CASH EXPENSES BREAKDOWN  (all ${days.length} days)`);
console.log(`${"═".repeat(72)}`);
for (const [label, amt] of sortedExp) {
  console.log(`  ${label.padEnd(40)} ₹${String(amt).padStart(6)}`);
}
console.log(`  ${"─".repeat(48)}`);
console.log(`  ${"TOTAL CASH OUT".padEnd(40)} ₹${String(totExp).padStart(6)}`);

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${"═".repeat(72)}`);
console.log(`  SUMMARY (${days.length} days, June 1–13)`);
console.log(`${"═".repeat(72)}`);
console.log(`  Total Cash Sales        ₹${totCash.toLocaleString("en-IN")}`);
console.log(`  Total Online Sales      ₹${totOnline.toLocaleString("en-IN")}`);
console.log(`  ─────────────────────────────────`);
console.log(`  TOTAL REVENUE           ₹${totSale.toLocaleString("en-IN")}`);
console.log(`  Total Cash Expenses     ₹${totExp.toLocaleString("en-IN")}`);
console.log(`  Avg Daily Revenue       ₹${Math.round(totSale / days.length).toLocaleString("en-IN")}`);
console.log(`  Avg Daily Cash Expenses ₹${Math.round(totExp / days.length).toLocaleString("en-IN")}`);

const pct = (v) => ((v / totSale) * 100).toFixed(1) + "%";
console.log(`\n  Platform Mix:`);
console.log(`    Cash      ${pct(totCash).padStart(6)}  ₹${totCash.toLocaleString("en-IN")}`);
console.log(`    Card      ${pct(totCard).padStart(6)}  ₹${totCard.toLocaleString("en-IN")}`);
console.log(`    UPI       ${pct(totUPI).padStart(6)}  ₹${totUPI.toLocaleString("en-IN")}`);
console.log(`    Zomato Go ${pct(totZoGoid).padStart(6)}  ₹${totZoGoid.toLocaleString("en-IN")}`);
console.log(`    Zomato    ${pct(totZomato).padStart(6)}  ₹${totZomato.toLocaleString("en-IN")}`);
console.log(`    Swiggy    ${pct(totSwiggy).padStart(6)}  ₹${totSwiggy.toLocaleString("en-IN")}`);
console.log(`    SwgDinout ${pct(totSwgDin).padStart(6)}  ₹${totSwgDin.toLocaleString("en-IN")}`);
console.log(`    EazyDiner ${pct(totEazy).padStart(6)}  ₹${totEazy.toLocaleString("en-IN")}`);
console.log("");
