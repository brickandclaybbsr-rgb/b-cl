import XLSX from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = path.join(__dirname, "..", "Assets", "attendance brick and clay");

const FILES = [
  { path: path.join(base, "april", "10_StandardReport.xls"), month: "April 2026" },
  { path: path.join(base, "may",   "10_StandardReport.xls"), month: "May 2026" },
  { path: path.join(base,          "10_StandardReport.xls"), month: "June 2026 (1–13)" },
];

function cellStr(ws, r, c) {
  const cell = ws[XLSX.utils.encode_cell({ r, c })];
  return cell ? String(cell.v ?? "").trim() : "";
}

function parseAttStat(ws) {
  const range = XLSX.utils.decode_range(ws["!ref"]);
  const staff = [];
  for (let r = 4; r <= range.e.r; r++) {
    const id   = cellStr(ws, r, 0);
    const name = cellStr(ws, r, 1);
    if (!id || !name) continue;
    staff.push({
      id,
      name,
      normalHours: cellStr(ws, r, 3),
      realHours:   cellStr(ws, r, 4),
      lateTimes:   parseInt(cellStr(ws, r, 5)) || 0,
      lateMin:     parseInt(cellStr(ws, r, 6)) || 0,
      earlyTimes:  parseInt(cellStr(ws, r, 7)) || 0,
      earlyMin:    parseInt(cellStr(ws, r, 8)) || 0,
      attReal:     cellStr(ws, r, 11), // "22/18" format
      absent:      parseInt(cellStr(ws, r, 13)) || 0,
    });
  }
  return staff;
}

function parseExceptions(ws) {
  const range = XLSX.utils.decode_range(ws["!ref"]);
  const records = [];
  for (let r = 4; r <= range.e.r; r++) {
    const id      = cellStr(ws, r, 0);
    const name    = cellStr(ws, r, 1);
    const date    = cellStr(ws, r, 3);
    const onDuty  = cellStr(ws, r, 4);
    const offDuty = cellStr(ws, r, 5);
    const lateMin = parseInt(cellStr(ws, r, 8))  || 0;
    const earlyMin= parseInt(cellStr(ws, r, 9))  || 0;
    const absMin  = parseInt(cellStr(ws, r, 10)) || 0;
    if (!id || !name || !date) continue;
    records.push({ id, name, date, onDuty, offDuty, lateMin, earlyMin, absMin });
  }
  return records;
}

function hhmm(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

// ── Process all months ───────────────────────────────────────────────────────
const allStats    = {};  // name → { months: [], totalLateMin, totalAbsent, totalPresent }
const allRecords  = [];

for (const { path: fp, month } of FILES) {
  const wb = XLSX.readFile(fp, { cellDates: true });

  const statSheet = wb.Sheets["Att. Stat."];
  const excSheet  = wb.Sheets["Exception Stat."];
  if (!statSheet) { console.log(`[SKIP] ${month} — no Att. Stat.`); continue; }

  const stats   = parseAttStat(statSheet);
  const records = excSheet ? parseExceptions(excSheet) : [];

  console.log(`\n${"═".repeat(60)}`);
  console.log(`  ${month}`);
  console.log(`${"═".repeat(60)}`);
  console.log(`\n  ATTENDANCE SUMMARY`);
  console.log(`  ${"─".repeat(56)}`);
  console.log(`  ${"Name".padEnd(14)} ${"Present".padStart(9)} ${"Absent".padStart(8)} ${"Late(×)".padStart(9)} ${"Late(min)".padStart(11)} ${"EarlyLeave(×)".padStart(14)}`);
  console.log(`  ${"─".repeat(56)}`);

  for (const s of stats) {
    const [norm, real] = (s.attReal || "0/0").split("/").map(Number);
    const flag = s.realHours === "0:00" ? " ⚠ NOT ENROLLED" : "";
    console.log(
      `  ${s.name.padEnd(14)} ${String(real).padStart(5)}/${String(norm).padEnd(2)}   ${String(s.absent).padStart(6)}   ${String(s.lateTimes).padStart(7)}   ${String(s.lateMin).padStart(9)}     ${String(s.earlyTimes).padStart(5)}${flag}`
    );

    if (!allStats[s.name]) allStats[s.name] = { totalLateMin: 0, totalAbsent: 0, totalPresent: 0, months: [] };
    allStats[s.name].totalLateMin  += s.lateMin;
    allStats[s.name].totalAbsent   += s.absent;
    allStats[s.name].totalPresent  += real;
    allStats[s.name].months.push({ month, ...s });
  }

  // Per-day late arrival details (only for staff who actually scan)
  const lateArrivals = records.filter(r => r.onDuty && r.lateMin > 30);
  if (lateArrivals.length) {
    console.log(`\n  LATE ARRIVALS (>30 min late)`);
    console.log(`  ${"─".repeat(56)}`);
    for (const r of lateArrivals) {
      console.log(`  ${r.name.padEnd(14)} ${r.date}  in:${r.onDuty || "—"}  out:${r.offDuty || "MISSING"}  late:${hhmm(r.lateMin)}`);
    }
  }

  // Missing check-out
  const noCheckout = records.filter(r => r.onDuty && !r.offDuty);
  if (noCheckout.length) {
    console.log(`\n  MISSING CHECK-OUT`);
    console.log(`  ${"─".repeat(56)}`);
    for (const r of noCheckout) {
      console.log(`  ${r.name.padEnd(14)} ${r.date}  in:${r.onDuty}`);
    }
  }

  allRecords.push(...records);
}

// ── 3-Month Summary ──────────────────────────────────────────────────────────
console.log(`\n${"═".repeat(60)}`);
console.log(`  3-MONTH CUMULATIVE SUMMARY (Apr–Jun)`);
console.log(`${"═".repeat(60)}`);
console.log(`  ${"Name".padEnd(14)} ${"Present".padStart(9)} ${"Absent".padStart(8)} ${"Total Late".padStart(12)}`);
console.log(`  ${"─".repeat(46)}`);

for (const [name, s] of Object.entries(allStats)) {
  const notEnrolled = s.totalPresent === 0 ? " ← NOT ENROLLED / LEFT" : "";
  console.log(
    `  ${name.padEnd(14)} ${String(s.totalPresent).padStart(7)}   ${String(s.totalAbsent).padStart(6)}   ${hhmm(s.totalLateMin).padStart(10)}${notEnrolled}`
  );
}

// ── Avg arrival time per active staff ───────────────────────────────────────
function timeToMin(t) {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function minToTime(m) {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

const arrivalMap = {};
for (const r of allRecords) {
  if (!r.onDuty) continue;
  const mins = timeToMin(r.onDuty);
  if (mins === null) continue;
  if (!arrivalMap[r.name]) arrivalMap[r.name] = [];
  arrivalMap[r.name].push(mins);
}

console.log(`\n${"═".repeat(60)}`);
console.log(`  AVERAGE ARRIVAL TIME (enrolled staff only)`);
console.log(`${"═".repeat(60)}`);
console.log(`  Shift expected start: 11:00`);
console.log(`  ${"─".repeat(46)}`);
for (const [name, times] of Object.entries(arrivalMap)) {
  const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  const lateBy = avg - 11 * 60;
  const flag = lateBy > 60 ? " ← CHRONIC LATE" : lateBy > 30 ? " ← OFTEN LATE" : "";
  console.log(`  ${name.padEnd(14)} avg arrival: ${minToTime(avg)}  (${lateBy > 0 ? "+" : ""}${lateBy} min from 11:00)${flag}`);
}

console.log("\n");
