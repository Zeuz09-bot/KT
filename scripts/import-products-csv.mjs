/**
 * Keraunous Tech Store — CSV Catalogue Importer
 *
 * Imports real product data, brands, categories, variants, and specifications
 * from CSV files into Supabase with integer Naira pricing.
 *
 * Usage:
 *   node scripts/import-products-csv.mjs [path-to-csv]
 * Default path:
 *   scripts/sample-products.csv
 */

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

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
    // Handle standard CSV comma splitting (supporting unescaped commas for simplicity)
    const values = [];
    let inQuotes = false;
    let currentValue = '';

    for (let charIndex = 0; charIndex < line.length; charIndex++) {
      const char = line[charIndex];
      if (char === '"') {
        inQuotes = !inQuotes;
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
    const title = row.title;
    const slug = row.slug || slugify(title);
    const description = row.description || '';
    const condition = row.condition || 'Brand New';
    const variantName = row.variant_name || 'Standard';
    const sku = row.sku || `${slug}-${slugify(variantName)}`;
    const priceNgn = Math.round(Number(row.price_ngn));
    const compareAtNgn = row.compare_at_price_ngn ? Math.round(Number(row.compare_at_price_ngn)) : null;
    const stockQuantity = parseInt(row.stock_quantity || '0', 10);
    const specsString = row.specs || '';

    if (!title || isNaN(priceNgn) || priceNgn <= 0) {
      console.warn(`[IMPORT] Skipping row with invalid title or price:`, row);
      continue;
    }

    // 1. Ensure Brand exists
    const brandSlug = slugify(brandName);
    let { data: brand } = await supabase.from('brands').select('id').eq('slug', brandSlug).single();
    if (!brand) {
      const { data: newBrand, error } = await supabase
        .from('brands')
        .insert({ name: brandName, slug: brandSlug })
        .select('id')
        .single();
      if (error) throw new Error(`Failed to create brand ${brandName}: ${error.message}`);
      brand = newBrand;
    }

    // 2. Ensure Category exists
    const categorySlug = slugify(categoryName);
    let { data: category } = await supabase.from('categories').select('id').eq('slug', categorySlug).single();
    if (!category) {
      const { data: newCat, error } = await supabase
        .from('categories')
        .insert({ name: categoryName, slug: categorySlug })
        .select('id')
        .single();
      if (error) throw new Error(`Failed to create category ${categoryName}: ${error.message}`);
      category = newCat;
    }

    // 3. Ensure Product exists
    let { data: product } = await supabase.from('products').select('id').eq('slug', slug).single();
    if (!product) {
      const { data: newProd, error } = await supabase
        .from('products')
        .insert({
          title,
          slug,
          description,
          condition,
          brand_id: brand.id,
          category_id: category.id,
          is_published: true,
        })
        .select('id')
        .single();
      if (error) throw new Error(`Failed to create product ${title}: ${error.message}`);
      product = newProd;
    }

    // 4. Upsert Variant
    const { error: variantError } = await supabase
      .from('product_variants')
      .upsert({
        product_id: product.id,
        name: variantName,
        sku,
        price_ngn: priceNgn,
        compare_at_price_ngn: compareAtNgn,
        stock_quantity: stockQuantity,
        is_active: true,
      }, { onConflict: 'sku' });

    if (variantError) {
      console.error(`[IMPORT] Failed to upsert variant ${sku}:`, variantError.message);
      continue;
    }

    // 5. Insert Specs if provided
    if (specsString) {
      const specPairs = specsString.split(';').map((s) => s.trim()).filter(Boolean);
      for (const pair of specPairs) {
        const [k, v] = pair.split(':').map((item) => item?.trim());
        if (k && v) {
          await supabase.from('product_specs').upsert({
            product_id: product.id,
            spec_key: k,
            spec_value: v,
          }, { onConflict: 'product_id,spec_key' }).catch(() => {});
        }
      }
    }

    importedVariantsCount++;
    console.log(`[IMPORT] ✓ Successfully processed: ${title} — ${variantName} (₦${priceNgn.toLocaleString('en-NG')}, Stock: ${stockQuantity})`);
  }

  console.log(`\n[IMPORT] Done! Successfully imported/updated ${importedVariantsCount} variant(s).`);
}

runImport().catch((err) => {
  console.error('[IMPORT] Fatal error during import:', err);
  process.exit(1);
});
