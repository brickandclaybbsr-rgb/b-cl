import XLSX from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = path.join(__dirname, "..", "Assets", "attendance brick and clay");

function analyzeReport(filePath, label) {
  try {
    const wb = XLSX.readFile(filePath, { cellDates: true });
    console.log(`\n${"=".repeat(60)}`);
    console.log(`FILE: ${label}`);
    console.log(`Sheets: ${wb.SheetNames.join(", ")}`);
    for (const name of wb.SheetNames) {
      const ws = wb.Sheets[name];
      const data = XLSX.utils.sheet_to_json(ws, { defval: "" });
      console.log(`\n--- Sheet: "${name}" (${data.length} rows) ---`);
      if (data.length > 0) {
        const cols = Object.keys(data[0]);
        console.log("Columns:", cols.join(" | "));
        data.slice(0, 20).forEach((row, i) => {
          console.log(`Row ${i + 1}:`, JSON.stringify(row));
        });
        if (data.length > 20) console.log(`... (+${data.length - 20} more rows)`);
      }
    }
  } catch (e) {
    console.error(`ERROR reading ${label}: ${e.message}`);
  }
}

analyzeReport(path.join(base, "AttSetting.xls"), "AttSetting.xls (root)");
analyzeReport(path.join(base, "april", "10_StandardReport.xls"), "April StandardReport");
analyzeReport(path.join(base, "may", "10_StandardReport.xls"), "May StandardReport");
