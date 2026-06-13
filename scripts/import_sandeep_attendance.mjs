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

function cellStr(ws, r, c) {
  const cell = ws[XLSX.utils.encode_cell({ r, c })];
  return cell ? String(cell.v ?? "").trim() : "";
}

const punches = []; // { date, time, status }

for (const { path: fp, month } of FILES) {
  const wb = XLSX.readFile(fp, { cellDates: true });
  const ws = wb.Sheets["Exception Stat."];
  if (!ws) { console.error(`No Exception Stat. in ${month}`); continue; }

  const range = XLSX.utils.decode_range(ws["!ref"]);
  let foundSande = false;

  for (let r = 4; r <= range.e.r; r++) {
    const name = cellStr(ws, r, 1);
    if (!name) continue;

    // "sande" rows only
    if (name.toLowerCase() !== "sande") continue;
    foundSande = true;

    const date    = cellStr(ws, r, 3); // YYYY-MM-DD
    const onDuty  = cellStr(ws, r, 4); // HH:MM or empty
    const offDuty = cellStr(ws, r, 5); // HH:MM or empty

    if (!date) continue;

    if (onDuty)  punches.push({ date, time: onDuty + ":00",  status: "Check-In",  biometric_name: "sande", pin: "8" });
    if (offDuty) punches.push({ date, time: offDuty + ":00", status: "Check-Out", biometric_name: "sande", pin: "8" });
  }

  console.log(`${month}: found sande=${foundSande}, punches so far: ${punches.length}`);
}

console.log(`\nTotal punches extracted: ${punches.length}`);

// Generate SQL
const lines = [
  `-- Attendance punches for Sandeep Nayak ("sande" in biometric)`,
  `-- Run in Supabase SQL Editor`,
  `-- This uses his profile ID by name lookup — verify the name matches exactly`,
  ``,
  `DO $$`,
  `DECLARE`,
  `  v_profile_id uuid;`,
  `BEGIN`,
  `  SELECT id INTO v_profile_id FROM public.profiles WHERE name = 'Sandeep Nayak' LIMIT 1;`,
  ``,
  `  IF v_profile_id IS NULL THEN`,
  `    RAISE EXCEPTION 'Profile not found for Sandeep Nayak — check the name in profiles table';`,
  `  END IF;`,
  ``,
  `  -- Insert punches (ON CONFLICT DO NOTHING skips duplicates)`,
];

for (const p of punches) {
  lines.push(
    `  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name)` +
    ` VALUES (v_profile_id, '${p.pin}', '${p.biometric_name}', '${p.date}', '${p.time}', '${p.status}', 'Brickandclay')` +
    ` ON CONFLICT (profile_id, date, time) DO NOTHING;`
  );
}

lines.push(``, `  RAISE NOTICE 'Done — inserted punches for Sandeep Nayak';`, `END $$;`);

const sql = lines.join("\n");
const outPath = path.join(__dirname, "sandeep_attendance.sql");
fs.writeFileSync(outPath, sql, "utf8");
console.log(`\nSQL written to: scripts/sandeep_attendance.sql`);
console.log(`Run it in Supabase SQL Editor to import all ${punches.length} punches.`);
