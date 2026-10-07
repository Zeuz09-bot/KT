/**
 * apply-seed.mjs — applies db/seed.sql to the Supabase project
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnv(p) {
  try {
    for (const line of readFileSync(p, 'utf8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i === -1) continue;
      process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
    }
  } catch { /* ignore */ }
}
loadEnv(join(root, '.env.local'));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const pat = process.env.SUPABASE_ACCESS_TOKEN;

if (!pat) {
  console.error('SUPABASE_ACCESS_TOKEN not set — add it to .env.local temporarily');
  process.exit(1);
}

const projectRef = new URL(url).hostname.split('.')[0];
const sql = readFileSync(join(root, 'db', 'seed.sql'), 'utf8');

console.log(`Seeding project: ${projectRef}...`);

const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${pat}`,
  },
  body: JSON.stringify({ query: sql }),
});

const text = await res.text();
if (res.ok) {
  console.log('✅ Seed applied successfully.');
} else {
  console.error(`❌ Seed failed — HTTP ${res.status}`);
  console.error(text.slice(0, 1000));
  process.exit(1);
}
