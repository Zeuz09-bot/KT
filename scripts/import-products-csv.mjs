/**
 * Keraunous Tech Store — CSV Catalogue Importer
 *
 * Imports real product data, brands, categories, variants, and specifications
 * from CSV files into Supabase with integer Naira pricing matching schema types.
 *
 * Usage:
 *   node scripts/import-products-csv.mjs [path-to-csv]
 * Default path:
 *   scripts/sample-products.csv
 */

import fs from 'node:fs';
import path from 'node:path';
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
  console.error('[IMPORT] Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

function parseCSV(content) {
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = [];
    let inQuotes = false;
    let currentValue = '';

    for (let charIndex = 0; charIndex < line.length; charIndex++) {
      const char = line[charIndex];
      if (char === '"') {
        if (inQuotes && line[charIndex + 1] === '"') {
          currentValue += '"';
          charIndex++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());

    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    rows.push(row);
  }

  return rows;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

async function runImport() {
  const csvFile = process.argv[2] || path.resolve(process.cwd(), 'scripts', 'sample-products.csv');

  if (!fs.existsSync(csvFile)) {
    console.error(`[IMPORT] Error: File not found at ${csvFile}`);
    process.exit(1);
  }

  console.log(`[IMPORT] Reading CSV from: ${csvFile}`);
  const csvContent = fs.readFileSync(csvFile, 'utf-8');
  const rows = parseCSV(csvContent);

  console.log(`[IMPORT] Found ${rows.length} product/variant row(s) to process.`);

  let importedVariantsCount = 0;

  for (const row of rows) {
    const brandName = row.brand_name || 'Generic';
    const categoryName = row.category_name || 'Accessories';
    const name = row.name || row.title;
    const slug = row.slug || slugify(name);
    const shortDescription = row.short_description || '';
    const description = row.description || '';
    const sku = row.sku || `${slug}-${slugify(row.color || 'default')}`;
    const condition = row.condition || 'brand_new';
    const color = row.color || null;
    const storageGb = row.storage_gb ? parseInt(row.storage_gb, 10) : null;
    const ramGb = row.ram_gb ? parseInt(row.ram_gb, 10) : null;
    const priceNgn = Math.round(Number(row.price_ngn));
    const compareAtNgn = row.compare_at_price_ngn ? Math.round(Number(row.compare_at_price_ngn)) : null;
    const stockQty = parseInt(row.stock_qty || row.stock_quantity || '0', 10);
    
    let specs = {};
    if (row.specs) {
      try {
        specs = JSON.parse(row.specs);
      } catch {
        // Fallback for simple key:value; format
        const pairs = row.specs.split(';').map((s) => s.trim()).filter(Boolean);
        for (const p of pairs) {
          const [k, v] = p.split(':').map((s) => s?.trim());
          if (k && v) specs[k] = v;
        }
      }
    }

    if (!name || isNaN(priceNgn) || priceNgn <= 0) {
      console.warn(`[IMPORT] Skipping row with invalid name or price:`, row);
      continue;
    }

    // 1. Ensure Brand exists
    const brandSlug = slugify(brandName);
    let { data: brand } = await supabase.from('brands').select('id').eq('slug', brandSlug).maybeSingle();
    if (!brand) {
      const { data: newBrand, error } = await supabase
        .from('brands')
        .insert({ name: brandName, slug: brandSlug, is_active: true })
        .select('id')
        .single();
      if (error) throw new Error(`Failed to create brand ${brandName}: ${error.message}`);
      brand = newBrand;
    }

    // 2. Ensure Category exists
    const categorySlug = slugify(categoryName);
    let { data: category } = await supabase.from('categories').select('id').eq('slug', categorySlug).maybeSingle();
    if (!category) {
      const { data: newCat, error } = await supabase
        .from('categories')
        .insert({ name: categoryName, slug: categorySlug, is_active: true })
        .select('id')
        .single();
      if (error) throw new Error(`Failed to create category ${categoryName}: ${error.message}`);
      category = newCat;
    }

    // 3. Ensure Product exists
    let { data: product } = await supabase.from('products').select('id').eq('slug', slug).maybeSingle();
    if (!product) {
      const searchKey = `${name} ${brandName} ${categoryName}`.toLowerCase();
      const { data: newProd, error } = await supabase
        .from('products')
        .insert({
          name,
          slug,
          brand_id: brand.id,
          category_id: category.id,
          short_description: shortDescription,
          description,
          specs,
          status: 'published',
          search_key: searchKey,
        })
        .select('id')
        .single();
      if (error) throw new Error(`Failed to create product ${name}: ${error.message}`);
      product = newProd;
    }

    // 4. Upsert Variant (check by SKU or unique combo)
    let { data: existingVariant } = await supabase
      .from('product_variants')
      .select('id')
      .eq('product_id', product.id)
      .eq('condition', condition)
      .match(storageGb !== null ? { storage_gb: storageGb } : {})
      .match(color !== null ? { color } : {})
      .maybeSingle();

    if (!existingVariant) {
      const { data: bySku } = await supabase
        .from('product_variants')
        .select('id')
        .eq('sku', sku)
        .maybeSingle();
      if (bySku) existingVariant = bySku;
    }

    let variantError = null;
    if (existingVariant) {
      const { error } = await supabase
        .from('product_variants')
        .update({
          sku,
          price_ngn: priceNgn,
          compare_at_price_ngn: compareAtNgn,
          stock_qty: stockQty,
          is_active: true,
          ram_gb: ramGb,
        })
        .eq('id', existingVariant.id);
      variantError = error;
    } else {
      const { error } = await supabase
        .from('product_variants')
        .insert({
          product_id: product.id,
          sku,
          condition,
          color,
          storage_gb: storageGb,
          ram_gb: ramGb,
          price_ngn: priceNgn,
          compare_at_price_ngn: compareAtNgn,
          stock_qty: stockQty,
          is_active: true,
        });
      variantError = error;
    }

    if (variantError) {
      console.error(`[IMPORT] Failed to save variant ${sku}:`, variantError.message);
      continue;
    }

    importedVariantsCount++;
    console.log(`[IMPORT] ✓ Successfully processed: ${name} — SKU: ${sku} (₦${priceNgn.toLocaleString('en-NG')}, Stock: ${stockQty})`);
  }

  console.log(`\n[IMPORT] Done! Successfully imported/updated ${importedVariantsCount} variant(s).`);
}

runImport().catch((err) => {
  console.error('[IMPORT] Fatal error during import:', err);
  process.exit(1);
});
