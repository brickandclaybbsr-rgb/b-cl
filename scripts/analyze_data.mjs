import XLSX from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, "..", "Assets");

function readSheet(filePath, label) {
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
        console.log("Columns:", Object.keys(data[0]).join(" | "));
        // Print first 10 rows
        data.slice(0, 10).forEach((row, i) => {
          console.log(`Row ${i + 1}:`, JSON.stringify(row));
        });
        if (data.length > 10) console.log(`... (${data.length - 10} more rows)`);
      }
    }
  } catch (e) {
    console.log(`ERROR reading ${label}: ${e.message}`);
  }
}

// Closing Balance
readSheet(
  path.join(assetsDir, "CLOSING BALANCE 2026.xlsx"),
  "CLOSING BALANCE 2026.xlsx"
);

// Attendance files
readSheet(
  path.join(assetsDir, "attendance brick and clay", "10_StandardReport.xls"),
  "Attendance - Root 10_StandardReport.xls"
);
readSheet(
  path.join(assetsDir, "attendance brick and clay", "AttSetting.xls"),
  "Attendance - Root AttSetting.xls"
);
readSheet(
  path.join(assetsDir, "attendance brick and clay", "april", "10_StandardReport.xls"),
  "Attendance - April 10_StandardReport.xls"
);
readSheet(
  path.join(assetsDir, "attendance brick and clay", "may", "10_StandardReport.xls"),
  "Attendance - May 10_StandardReport.xls"
);
