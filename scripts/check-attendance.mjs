import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
const envPath = path.resolve('.env.local');
if (!fs.existsSync(envPath)) {
  console.error(".env.local not found!");
  process.exit(1);
}

const envFile = fs.readFileSync(envPath, 'utf-8');
const env = {};
envFile.split(/\r?\n/).forEach(line => {
  const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)\s*$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    }
    env[match[1]] = val;
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function main() {
  console.log("=== PROFILES ===");
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
  if (pErr) console.error("Error fetching profiles:", pErr);
  else console.log(profiles);

  console.log("\n=== ATTENDANCE PUNCHES ===");
  const { data: punches, error: punchErr } = await supabase.from('attendance_punches').select('*').limit(10);
  if (punchErr) console.error("Error fetching punches:", punchErr);
  else console.log(`Found ${punches.length} punches (first 10 shown):`, punches);
}

main().catch(console.error);
