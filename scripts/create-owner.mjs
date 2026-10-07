/**
 * scripts/create-owner.mjs
 *
 * Bootstraps the first Owner account in Supabase Auth & admin_users table.
 * Uses the Service Role Key from .env.local.
 *
 * Usage:
 *   node scripts/create-owner.mjs <email> <password> [displayName]
 *
 * Example:
 *   node scripts/create-owner.mjs owner@keraunous.ng "SecurePassword123!" "Owner Ade"
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnv(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      process.env[key] = value;
    }
  } catch {
    /* ignore */
  }
}
loadEnv(join(root, '.env.local'));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

const email = process.argv[2] || 'owner@keraunous.ng';
const password = process.argv[3] || 'Keraunous2026!Owner';
const displayName = process.argv[4] || 'Store Owner';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log(`\nBootstrapping Owner account for: ${email}`);

  // 1. Check if user already exists
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Failed to list users:', listError.message);
    process.exit(1);
  }

  let user = usersData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (!user) {
    console.log('Creating auth user...');
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    });

    if (createError) {
      console.error('Failed to create auth user:', createError.message);
      process.exit(1);
    }
    user = createData.user;
    console.log(`✓ Auth user created with ID: ${user.id}`);
  } else {
    console.log(`ℹ Auth user already exists with ID: ${user.id}. Updating password...`);
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
    });
    if (updateError) {
      console.error('Failed to update user password:', updateError.message);
      process.exit(1);
    }
    console.log('✓ Password updated.');
  }

  // 2. Ensure row in admin_users table
  const { data: existingAdmin, error: adminQueryError } = await supabase
    .from('admin_users')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (adminQueryError) {
    console.error('Failed to check admin_users table:', adminQueryError.message);
    process.exit(1);
  }

  if (!existingAdmin) {
    console.log('Inserting into admin_users table as role "owner"...');
    const { error: insertError } = await supabase.from('admin_users').insert({
      user_id: user.id,
      role: 'owner',
      display_name: displayName,
      is_active: true,
    });

    if (insertError) {
      console.error('Failed to insert admin_users row:', insertError.message);
      process.exit(1);
    }
    console.log('✓ Inserted into admin_users.');
  } else {
    console.log('Updating existing admin_users row to role "owner" and is_active: true...');
    const { error: updateError } = await supabase
      .from('admin_users')
      .update({
        role: 'owner',
        display_name: displayName,
        is_active: true,
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Failed to update admin_users row:', updateError.message);
      process.exit(1);
    }
    console.log('✓ Updated admin_users record.');
  }

  // 3. Write audit log
  await supabase.from('audit_log').insert({
    actor_id: user.id,
    action: 'admin_user.bootstrap_owner',
    entity: 'admin_users',
    entityId: user.id,
    after: { email, role: 'owner', display_name: displayName },
  });

  console.log('\n======================================================');
  console.log('✅ Owner account bootstrap complete!');
  console.log(`Email:    ${email}`);
  console.log(`Role:     owner`);
  console.log(`Display:  ${displayName}`);
  console.log('======================================================\n');
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
