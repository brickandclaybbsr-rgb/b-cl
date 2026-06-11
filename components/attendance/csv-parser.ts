export interface BiometricRow {
  pin: string;
  name: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS
  status: string; // Check In / Check Out / etc.
  deptName: string;
}

/** Parses LX50 Biometric CSV attendance export strings */
export function parseBiometricCSV(text: string): BiometricRow[] {
  // Strip BOM if present
  if (text.charCodeAt(0) === 0xFEFF) {
    text = text.slice(1);
  }

  const lines = text.split(/\r?\n/);
  if (lines.length === 0) return [];

  // Find the header line (first line that contains "name" or "pin")
  let headerIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const cleanLine = lines[i].trim().toLowerCase();
    if (cleanLine.includes("name") || cleanLine.includes("pin") || cleanLine.includes("date")) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) return [];

  // Parse header
  const rawHeaders = parseCSVLine(lines[headerIndex]);
  const headers = rawHeaders.map(h => h.trim().toLowerCase());

  // Find column indices
  const pinIdx = headers.findIndex(h => h === "pin" || h.includes("pin"));
  const nameIdx = headers.findIndex(h => h === "name" || h.includes("name"));
  const dateIdx = headers.findIndex(h => h === "date" || h.includes("date"));
  const timeIdx = headers.findIndex(h => h === "time" || h.includes("time"));
  const statusIdx = headers.findIndex(h => h === "status" || h.includes("status"));
  const deptIdx = headers.findIndex(h => h === "dept name" || h.includes("dept"));

  const results: BiometricRow[] = [];

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVLine(line);

    const pin = pinIdx !== -1 ? (values[pinIdx] || "").trim() : "";
    const name = nameIdx !== -1 ? (values[nameIdx] || "").trim() : "";
    const date = dateIdx !== -1 ? (values[dateIdx] || "").trim() : "";
    const time = timeIdx !== -1 ? (values[timeIdx] || "").trim() : "";
    const status = statusIdx !== -1 ? (values[statusIdx] || "").trim() : "";
    const deptName = deptIdx !== -1 ? (values[deptIdx] || "").trim() : "";

    if (!name && !pin) continue; // Skip empty rows

    results.push({
      pin,
      name,
      date,
      time,
      status,
      deptName
    });
  }

  return results;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
