/**
 * apply-migrations.mjs
 * Applies SQL migration files to Supabase using the Management API
 * with a Personal Access Token (SUPABASE_ACCESS_TOKEN in .env.local).
 *
 * Usage:  node scripts/apply-migrations.mjs
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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
  } catch { /* ignore */ }
}
loadEnv(join(root, '.env.local'));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!SUPABASE_URL || !ACCESS_TOKEN) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ACCESS_TOKEN must be set in .env.local');
  process.exit(1);
}

const projectRef = new URL(SUPABASE_URL).hostname.split('.')[0];
console.log(`Project: ${projectRef}\n`);

async function executeSql(sql, label) {
  const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  const text = await res.text();
  if (res.ok) {
    console.log(`✓ ${label}`);
    return true;
  }
  console.error(`✗ ${label} — HTTP ${res.status}`);
  console.error(text.slice(0, 800));
  return false;
}

const migrationsDir = join(root, 'db', 'migrations');
const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

console.log(`Applying ${files.length} migration(s) to ${SUPABASE_URL}...\n`);

for (const file of files) {
  const sql = readFileSync(join(migrationsDir, file), 'utf8');
  const ok = await executeSql(sql, file);
  if (!ok) {
    console.error('\n❌ Migration failed — stopping.');
    process.exit(1);
  }
}

console.log('\n✅ All migrations applied successfully.');
console.log('\n⚠  REMINDER: Remove SUPABASE_ACCESS_TOKEN from .env.local now.');
