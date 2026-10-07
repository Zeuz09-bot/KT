/**
 * scripts/cleanup-orphan-images.mjs
 *
 * Scans the Supabase Storage `product-media` bucket and deletes orphaned files
 * that have no corresponding row in `product_images` and were created > 24 hours ago.
 *
 * Usage:
 *   node scripts/cleanup-orphan-images.mjs [--dry-run]
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
  console.error(
    'ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local',
  );
  process.exit(1);
}

const isDryRun = process.argv.includes('--dry-run');
const BUCKET_NAME = 'product-media';
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log(`\nRunning Orphan Media Cleanup (${isDryRun ? 'DRY RUN' : 'LIVE'})...`);

  // 1. List objects in product-media bucket
  const { data: storageFiles, error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .list('', { limit: 1000, sortBy: { column: 'created_at', order: 'asc' } });

  if (storageError) {
    console.error(`Failed to list storage objects: ${storageError.message}`);
    process.exit(1);
  }

  console.log(`Found ${storageFiles.length} object(s) in "${BUCKET_NAME}" storage bucket.`);

  // 2. Fetch all registered image paths from database
  const { data: dbImages, error: dbError } = await supabase
    .from('product_images')
    .select('path');

  if (dbError) {
    console.error(`Failed to query product_images table: ${dbError.message}`);
    process.exit(1);
  }

  const activePaths = new Set(dbImages.map((row) => row.path));
  console.log(`Found ${activePaths.size} registered image path(s) in database.`);

  const now = Date.now();
  const orphanPaths = [];

  for (const file of storageFiles) {
    if (!file.name || file.name === '.emptyFolderPlaceholder') continue;

    const fileAge = now - new Date(file.created_at).getTime();
    const isOrphan = !activePaths.has(file.name);

    if (isOrphan && fileAge > MAX_AGE_MS) {
      orphanPaths.push(file.name);
    }
  }

  console.log(`Identified ${orphanPaths.length} orphaned object(s) older than 24h.`);

  if (orphanPaths.length === 0) {
    console.log('✅ No orphaned images found to clean up.');
    return;
  }

  if (isDryRun) {
    console.log('\n[DRY RUN] Would delete the following orphaned objects:');
    orphanPaths.forEach((p) => console.log(`  - ${p}`));
  } else {
    console.log(`Deleting ${orphanPaths.length} orphaned object(s)...`);
    const { error: removeError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(orphanPaths);

    if (removeError) {
      console.error(`Failed to delete orphaned files: ${removeError.message}`);
      process.exit(1);
    }
    console.log(`✅ Successfully deleted ${orphanPaths.length} orphaned object(s).`);
  }
}

main().catch((err) => {
  console.error('Unexpected cleanup error:', err);
  process.exit(1);
});
