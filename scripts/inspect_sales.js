const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Read .env.local manually
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

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase configuration in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  console.log("--- PROFILES ---");
  const { data: profiles, error: pErr } = await supabase.from("profiles").select("id, name, role");
  if (pErr) console.error("Error fetching profiles:", pErr);
  else console.table(profiles);

  console.log("\n--- RECENT DAILY SALES ---");
  const { data: sales, error: sErr } = await supabase
    .from("daily_sales")
    .select("date, cash_sales, online_sales, aggregator_sales, total_bills, submitted_by, submitted_at")
    .order("date", { ascending: false })
    .limit(10);
  if (sErr) console.error("Error fetching daily_sales:", sErr);
  else console.table(sales);

  console.log("\n--- RECENT OPENING CHECKLISTS ---");
  const { data: opening, error: oErr } = await supabase
    .from("opening_checklists")
    .select("date, submitted_by, submitted_at")
    .order("date", { ascending: false })
    .limit(5);
  if (oErr) console.error("Error fetching opening:", oErr);
  else console.table(opening);

  console.log("\n--- RECENT CLOSING CHECKLISTS ---");
  const { data: closing, error: cErr } = await supabase
    .from("closing_checklists")
    .select("date, submitted_by, submitted_at")
    .order("date", { ascending: false })
    .limit(5);
  if (cErr) console.error("Error fetching closing:", cErr);
  else console.table(closing);
}

inspect();
