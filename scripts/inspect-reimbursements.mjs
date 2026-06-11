import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

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
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function main() {
  const { data: claims, error } = await supabase
    .from('reimbursements')
    .select('*');

  if (error) {
    console.error("Error fetching claims:", error.message);
    return;
  }

  console.log("Current claims in database:");
  console.log(JSON.stringify(claims, null, 2));

  // Let's also check table schema constraints from pg_catalog if possible
  const { data: constraints, error: constError } = await supabase
    .rpc('get_constraints_info'); // Let's try direct query or just testing an update

  console.log("\nTesting if we can update a pending claim...");
  const pending = claims.find(c => c.status === 'pending');
  if (pending) {
    console.log(`Found pending claim ID: ${pending.id}. Trying to update status to 'approved'...`);
    const { data, error: updateError } = await supabase
      .from('reimbursements')
      .update({ status: 'approved' })
      .eq('id', pending.id)
      .select();

    if (updateError) {
      console.error("Failed to update status to 'approved':", updateError.message);
    } else {
      console.log("Success! Updated claim:", data);
      // Revert it
      await supabase
        .from('reimbursements')
        .update({ status: 'pending' })
        .eq('id', pending.id);
      console.log("Reverted claim back to pending.");
    }
  } else {
    console.log("No pending claims found to test.");
  }
}

main().catch(console.error);
