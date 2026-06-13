import XLSX from "xlsx";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = path.join(__dirname, "..", "Assets", "attendance brick and clay");

const FILES = [
  { path: path.join(base, "april", "10_StandardReport.xls"), month: "April 2026" },
  { path: path.join(base, "may",   "10_StandardReport.xls"), month: "May 2026" },
  { path: path.join(base,          "10_StandardReport.xls"), month: "June 2026" },
];

// biometric name → app profile name (exact match in profiles table)
const NAME_MAP = {
  "pradosh":   { profileName: "Pradosh Ray",      pin: "2" },
  "ramahari":  { profileName: "Ramahari Pradhan", pin: "6" },
  "sande":     { profileName: "Sandeep Nayak",    pin: "8" },
  "manoj":     { profileName: "Manoj Naik",       pin: "9" },
};

function cellStr(ws, r, c) {
  const cell = ws[XLSX.utils.encode_cell({ r, c })];
  return cell ? String(cell.v ?? "").trim() : "";
}

// punchMap: profileName → [{ date, time, status, pin, bioName }]
const punchMap = {};
for (const info of Object.values(NAME_MAP)) {
  punchMap[info.profileName] = [];
}

for (const { path: fp, month } of FILES) {
  const wb = XLSX.readFile(fp, { cellDates: true });
  const ws = wb.Sheets["Exception Stat."];
  if (!ws) { console.error(`No Exception Stat. in ${month}`); continue; }

  const range = XLSX.utils.decode_range(ws["!ref"]);
  const monthCounts = {};

  for (let r = 4; r <= range.e.r; r++) {
    const rawName = cellStr(ws, r, 1).toLowerCase();
    const info = NAME_MAP[rawName];
    if (!info) continue;

    const date    = cellStr(ws, r, 3);
    const onDuty  = cellStr(ws, r, 4);
    const offDuty = cellStr(ws, r, 5);
    if (!date) continue;

    if (onDuty)  punchMap[info.profileName].push({ date, time: onDuty + ":00",  status: "Check-In",  pin: info.pin, bioName: rawName });
    if (offDuty) punchMap[info.profileName].push({ date, time: offDuty + ":00", status: "Check-Out", pin: info.pin, bioName: rawName });

    monthCounts[info.profileName] = (monthCounts[info.profileName] || 0) + (onDuty ? 1 : 0) + (offDuty ? 1 : 0);
  }

  console.log(`${month}:`, monthCounts);
}

// Summary
console.log("\nTotal punches per staff:");
for (const [name, punches] of Object.entries(punchMap)) {
  console.log(`  ${name}: ${punches.length}`);
}

// Generate combined SQL
const lines = [
  `-- ═══════════════════════════════════════════════════════════════════════`,
  `-- Brick & Clay — Historical Attendance Import (Apr–Jun 2026)`,
  `-- Staff: Pradosh, Ramahari, Sandeep Nayak, Manoj`,
  `-- Run in Supabase SQL Editor`,
  `-- ═══════════════════════════════════════════════════════════════════════`,
  ``,
];

for (const [profileName, punches] of Object.entries(punchMap)) {
  if (punches.length === 0) continue;

  lines.push(`-- ─── ${profileName} (${punches.length} punches) ───────────────────────────────`);
  lines.push(`DO $$`);
  lines.push(`DECLARE`);
  lines.push(`  v_profile_id uuid;`);
  lines.push(`BEGIN`);
  lines.push(`  SELECT id INTO v_profile_id FROM public.profiles WHERE name = '${profileName}' LIMIT 1;`);
  lines.push(`  IF v_profile_id IS NULL THEN`);
  lines.push(`    RAISE EXCEPTION 'Profile not found: ${profileName}';`);
  lines.push(`  END IF;`);
  lines.push(``);

  for (const p of punches) {
    lines.push(
      `  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name)` +
      ` VALUES (v_profile_id, '${p.pin}', '${p.bioName}', '${p.date}', '${p.time}', '${p.status}', 'Brickandclay')` +
      ` ON CONFLICT (profile_id, date, time) DO NOTHING;`
    );
  }

  lines.push(`  RAISE NOTICE 'Imported ${punches.length} punches for ${profileName}';`);
  lines.push(`END $$;`);
  lines.push(``);
}

const sql = lines.join("\n");
const outPath = path.join(__dirname, "all_attendance.sql");
fs.writeFileSync(outPath, sql, "utf8");
console.log(`\nSQL written to: scripts/all_attendance.sql`);
