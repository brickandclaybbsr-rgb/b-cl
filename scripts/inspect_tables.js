const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env.local");
const envContent = fs.readFileSync(envPath, "utf8");
const env = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : "";
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const tables = [
  "profiles",
  "opening_checklists",
  "closing_checklists",
  "daily_sales",
  "stock_items",
  "stock_snapshots",
  "vendors",
  "vendor_orders",
  "checklist_items",
  "eod_reports",
  "app_settings",
  "leaves",
  "staff_documents",
  "reimbursements"
];

async function countAll() {
  for (const table of tables) {
    const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
    if (error) {
      console.log(`${table}: Error - ${error.message}`);
    } else {
      console.log(`${table}: ${count} rows`);
    }
  }
}

countAll();
