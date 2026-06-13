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

async function inspectAll() {
  console.log("--- ALL DAILY SALES ---");
  const { data: sales, error: sErr } = await supabase.from("daily_sales").select("*");
  console.log(sErr || sales);

  console.log("\n--- ALL OPENING CHECKLISTS ---");
  const { data: opening, error: oErr } = await supabase.from("opening_checklists").select("*");
  console.log(oErr || opening);

  console.log("\n--- ALL CLOSING CHECKLISTS ---");
  const { data: closing, error: cErr } = await supabase.from("closing_checklists").select("*");
  console.log(cErr || closing);
}

inspectAll();
