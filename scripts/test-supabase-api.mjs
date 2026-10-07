/**
 * verify-schema.mjs — confirms tables exist in the Supabase project
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

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
loadEnv(join(__dirname, '..', '.env.local'));

const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key } = process.env;

const res = await fetch(`${url}/rest/v1/brands?select=id,name&limit=5`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
});
console.log('brands query status:', res.status);
const body = await res.text();
console.log('body:', body.slice(0, 400));

// Check tables via information_schema through PostgREST
const t2 = await fetch(`${url}/rest/v1/categories?select=id,name&limit=5`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
});
console.log('\ncategories query status:', t2.status);
const b2 = await t2.text();
console.log('body:', b2.slice(0, 400));

const t3 = await fetch(`${url}/rest/v1/products?select=id,name&limit=5`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
});
console.log('\nproducts query status:', t3.status);
const b3 = await t3.text();
console.log('body:', b3.slice(0, 400));

const t4 = await fetch(`${url}/rest/v1/orders?select=id&limit=5`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
});
console.log('\norders query status:', t4.status);
const b4 = await t4.text();
console.log('body:', b4.slice(0, 400));
