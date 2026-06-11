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
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(url, anonKey);

async function main() {
  console.log("Signing in as owner@brickandclay.in...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'owner@brickandclay.in',
    password: 'AdminPass123!'
  });

  if (authError) {
    console.error("Authentication failed:", authError.message);
    return;
  }

  const user = authData.user;
  console.log("Logged in successfully. User ID:", user.id);

  // Fetch claims as this user
  console.log("Fetching claims as logged-in owner...");
  const { data: claims, error: fetchError } = await supabase
    .from('reimbursements')
    .select('*');

  if (fetchError) {
    console.error("Error fetching claims:", fetchError.message);
    return;
  }

  console.log(`Found ${claims.length} claims.`);
  const pending = claims.find(c => c.status === 'pending');
  if (!pending) {
    console.log("No pending claims to test.");
    return;
  }

  console.log(`Attempting to update claim ${pending.id} to status 'approved' as owner...`);
  const { data: updated, error: updateError } = await supabase
    .from('reimbursements')
    .update({
      status: 'approved',
      processed_by: user.id,
      processed_at: new Date().toISOString()
    })
    .eq('id', pending.id)
    .select();

  if (updateError) {
    console.error("Update FAILED with error:", updateError.message);
  } else {
    console.log("Update SUCCEEDED:", updated);
    // Revert
    await supabase
      .from('reimbursements')
      .update({
        status: 'pending',
        processed_by: null,
        processed_at: null
      })
      .eq('id', pending.id);
    console.log("Reverted claim to pending.");
  }
}

main().catch(console.error);
