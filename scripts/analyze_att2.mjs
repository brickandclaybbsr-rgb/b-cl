import XLSX from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = path.join(__dirname, "..", "Assets", "attendance brick and clay");

function readSheetSample(filePath, sheetName, maxRows = 15) {
  const wb = XLSX.readFile(filePath, { cellDates: true });
  const ws = wb.Sheets[sheetName];
  if (!ws) { console.log(`Sheet "${sheetName}" not found`); return; }
  const data = XLSX.utils.sheet_to_json(ws, { defval: "" });
  console.log(`\n--- ${sheetName} (${data.length} rows) ---`);
  if (data.length) {
    console.log("Columns:", Object.keys(data[0]).filter(k => !k.startsWith("__")).slice(0, 15).join(" | "));
    data.slice(0, maxRows).forEach((row, i) => {
      // Print only non-empty values
      const clean = Object.fromEntries(Object.entries(row).filter(([k,v]) => v !== "" && !k.startsWith("__EMPTY")));
      if (Object.keys(clean).length > 0) console.log(`Row ${i+1}:`, JSON.stringify(clean));
    });
    if (data.length > maxRows) console.log(`... (+${data.length - maxRows} more rows)`);
  }
}

// April
const aprilPath = path.join(base, "april", "10_StandardReport.xls");
const mayPath = path.join(base, "may", "10_StandardReport.xls");

const aprilWb = XLSX.readFile(aprilPath);
console.log("APRIL Sheets:", aprilWb.SheetNames.join(", "));
for (const s of aprilWb.SheetNames) {
  readSheetSample(aprilPath, s, 10);
}

const mayWb = XLSX.readFile(mayPath);
console.log("\nMAY Sheets:", mayWb.SheetNames.join(", "));
for (const s of mayWb.SheetNames) {
  readSheetSample(mayPath, s, 10);
}
