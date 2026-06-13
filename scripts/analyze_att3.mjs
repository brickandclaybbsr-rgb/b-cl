import XLSX from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = path.join(__dirname, "..", "Assets", "attendance brick and clay");

function rawSheet(filePath, sheetName) {
  const wb = XLSX.readFile(filePath, { cellDates: true });
  const ws = wb.Sheets[sheetName];
  if (!ws) return;
  // Get raw cell values in row/col form
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
  console.log(`\n=== ${path.basename(filePath)} > "${sheetName}" (rows ${range.e.r+1}) ===`);
  for (let r = range.s.r; r <= Math.min(range.e.r, 30); r++) {
    const row = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[addr];
      row.push(cell ? String(cell.v ?? "").trim() : "");
    }
    const filled = row.filter(v => v !== "");
    if (filled.length > 0) console.log(`R${r+1}: ${row.slice(0, 20).join(" | ")}`);
  }
}

const files = [
  [path.join(base, "april", "10_StandardReport.xls"), "Att. Stat."],
  [path.join(base, "april", "10_StandardReport.xls"), "Exception Stat."],
  [path.join(base, "april", "10_StandardReport.xls"), "1.2.3"],
  [path.join(base, "may", "10_StandardReport.xls"), "Att. Stat."],
  [path.join(base, "may", "10_StandardReport.xls"), "Exception Stat."],
];

for (const [fp, sh] of files) rawSheet(fp, sh);
