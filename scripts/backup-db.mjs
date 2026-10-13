/**
 * Keraunous Tech Store — Database Backup Utility
 *
 * Dumps critical business and operational tables via Supabase Admin Client
 * to a timestamped backup directory with SHA-256 integrity checksums.
 *
 * Usage:
 *   node scripts/backup-db.mjs
 * Or with custom env:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/backup-db.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

// Auto-load .env.local if present
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[BACKUP] Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const TABLES_TO_BACKUP = [
  'system_settings',
  'brands',
  'categories',
  'products',
  'product_variants',
  'product_specs',
  'admin_users',
  'orders',
  'order_items',
  'order_events',
  'audit_log',
  'blocklist',
  'owner_alerts',
  'daily_summaries',
];

async function runBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.resolve(process.cwd(), 'backups', `backup-${timestamp}`);

  fs.mkdirSync(backupDir, { recursive: true });
  console.log(`[BACKUP] Starting database snapshot to: ${backupDir}`);

  const manifest = {
    timestamp: new Date().toISOString(),
    supabaseUrl: SUPABASE_URL.replace(/:[^:]+@/, ':***@'), // Mask any credentials in URL
    tables: {},
  };

  for (const table of TABLES_TO_BACKUP) {
    try {
      console.log(`[BACKUP] Exporting table '${table}'...`);
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' });

      if (error) {
        console.warn(`[BACKUP] Warning: Table '${table}' returned error: ${error.message}`);
        manifest.tables[table] = { status: 'error', error: error.message };
        continue;
      }

      const rows = data || [];
      const jsonContent = JSON.stringify(rows, null, 2);
      const filePath = path.join(backupDir, `${table}.json`);
      fs.writeFileSync(filePath, jsonContent, 'utf-8');

      const hash = crypto.createHash('sha256').update(jsonContent).digest('hex');

      manifest.tables[table] = {
        status: 'ok',
        rowCount: rows.length,
        sizeBytes: Buffer.byteLength(jsonContent, 'utf-8'),
        sha256: hash,
        file: `${table}.json`,
      };

      console.log(`[BACKUP] ✓ Exported '${table}': ${rows.length} rows (${Buffer.byteLength(jsonContent, 'utf-8')} bytes)`);
    } catch (err) {
      console.error(`[BACKUP] Failed to export table '${table}':`, err);
      manifest.tables[table] = { status: 'failed', error: String(err) };
    }
  }

  // Write manifest file
  const manifestPath = path.join(backupDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`[BACKUP] Backup completed successfully. Manifest written to ${manifestPath}`);
}

runBackup().catch((err) => {
  console.error('[BACKUP] Fatal backup failure:', err);
  process.exit(1);
});
