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

console.log(`Connecting to Supabase at: ${url}`);
const supabase = createClient(url, serviceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function main() {
  const action = process.argv[2];

  if (action === 'create') {
    const email = process.argv[3] || 'owner@brickandclay.in';
    const password = process.argv[4] || 'AdminPass123!';
    const name = process.argv[5] || 'Owner';
    const role = process.argv[6] || 'owner';

    console.log(`Creating user: ${email} (${name}) with role: ${role}...`);

    // Create user in auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role }
    });

    if (userError) {
      console.error("Error creating user in auth:", userError.message);
      return;
    }

    const userId = userData.user.id;
    console.log(`Successfully created auth user: ${userId}`);

    // Update profile role and email in case handle_new_user trigger had issues or we want to be explicit
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .update({ role, name, email })
      .eq('id', userId)
      .select();

    if (profileError) {
      console.error("Error updating profile:", profileError.message);
    } else {
      console.log("Updated profile:", profileData);
    }

  } else if (action === 'password') {
    const id = process.argv[3];
    const password = process.argv[4];
    if (!id || !password) {
      console.error("Usage: node scripts/manage-users.mjs password <user_id> <new_password>");
      return;
    }
    console.log(`Updating password for user ${id}...`);
    const { data, error } = await supabase.auth.admin.updateUserById(id, { password });
    if (error) {
      console.error("Error updating password:", error.message);
    } else {
      console.log("Successfully updated password for:", data.user.email);
    }
  } else {
    // List users
    console.log("Listing users in auth:");
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error("Error listing users:", listError.message);
      return;
    }

    if (users.length === 0) {
      console.log("No users found. Run 'node scripts/manage-users.mjs create' to create an owner user.");
    } else {
      for (const u of users) {
        // Get profile info
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', u.id)
          .single();
          
        console.log(`- ID: ${u.id} | Email: ${u.email} | Created: ${u.created_at}`);
        if (profile) {
          console.log(`  Profile: Name: ${profile.name} | Role: ${profile.role} | Active: ${profile.is_active}`);
        } else {
          console.log(`  Profile: (None found in profiles table)`);
        }
      }
    }
  }
}

main().catch(console.error);
