/**
 * Keraunous Tech Store — Unit Tests: Catalogue Management (U05)
 *
 * Verifies pure logic only (no database calls):
 * - Slug generation from product names
 * - Bulk price math: +/- %, rounding modes, floor guard
 * - CSV price import parsing and validation
 * - Publish guard rules
 * - Spec schema validation
 */

import { describe, it, expect } from 'vitest';
import {
  generateSlug,
  normaliseSlug,
} from '@/modules/catalog/slug';
import {
  applyPriceChange,
  computeBulkPreview,
  parseCsvPriceRows,
} from '@/modules/catalog/bulk-price';
import {
  checkPublishGuard,
  type PublishGuardInput,
} from '@/modules/catalog/publish-guard';
import {
  SpecsSchema,
  CsvPriceRowSchema,
  SlugSchema,
} from '@/lib/contracts/catalog';

// ---------------------------------------------------------------------------
// Slug generation
// ---------------------------------------------------------------------------

describe('generateSlug', () => {
  it('lowercases and hyphenates a product name', () => {
    expect(generateSlug('Apple iPhone 15 Pro Max')).toBe('apple-iphone-15-pro-max');
  });

  it('strips special characters', () => {
    expect(generateSlug('Samsung Galaxy S25+ Ultra')).toBe('samsung-galaxy-s25-ultra');
  });

  it('collapses multiple spaces and hyphens', () => {
    expect(generateSlug('  OnePlus   12R  ')).toBe('oneplus-12r');
  });

  it('handles digits and mixed case correctly', () => {
    expect(generateSlug('Xiaomi 14T Pro')).toBe('xiaomi-14t-pro');
  });

  it('removes leading/trailing hyphens', () => {
    expect(generateSlug('- AirPods Pro -')).toBe('airpods-pro');
  });
});

describe('normaliseSlug', () => {
  it('accepts a valid slug unchanged', () => {
    expect(normaliseSlug('apple-iphone-15-pro-max')).toBe('apple-iphone-15-pro-max');
  });

  it('lowercases and trims an uppercase slug', () => {
    expect(normaliseSlug('  Samsung-Galaxy  ')).toBe('samsung-galaxy');
  });

  it('replaces spaces with hyphens', () => {
    expect(normaliseSlug('google pixel 9')).toBe('google-pixel-9');
  });
});

describe('SlugSchema validation', () => {
  it('accepts valid slugs', () => {
    const valid = ['apple-iphone-15', 'samsung-s25', 'product-123'];
    for (const slug of valid) {
      expect(SlugSchema.safeParse(slug).success).toBe(true);
    }
  });

  it('rejects slugs with uppercase letters', () => {
    expect(SlugSchema.safeParse('Apple-iPhone').success).toBe(false);
  });

  it('rejects slugs with consecutive hyphens', () => {
    expect(SlugSchema.safeParse('apple--iphone').success).toBe(false);
  });

  it('rejects slugs with spaces', () => {
    expect(SlugSchema.safeParse('apple iphone').success).toBe(false);
  });

  it('rejects slugs shorter than 2 characters', () => {
    expect(SlugSchema.safeParse('a').success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Bulk price math
// ---------------------------------------------------------------------------

describe('applyPriceChange', () => {
  it('increases price by percentage', () => {
    // +10% on ₦100,000 = ₦110,000
    expect(applyPriceChange(100_000, 'increase_pct', 10, undefined)).toBe(110_000);
  });

  it('decreases price by percentage', () => {
    // -20% on ₦100,000 = ₦80,000
    expect(applyPriceChange(100_000, 'decrease_pct', 20, undefined)).toBe(80_000);
  });

  it('rounds to nearest ₦500 (up)', () => {
    // +15% on ₦100,000 = ₦115,000 — already divisible by 500
    expect(applyPriceChange(100_000, 'increase_pct', 15, 500)).toBe(115_000);
  });

  it('rounds to nearest ₦500 (fractional result)', () => {
    // +10% on ₦101,000 = ₦111,100 → rounds to ₦111,000 or ₦111,500
    const result = applyPriceChange(101_000, 'increase_pct', 10, 500);
    expect(result % 500).toBe(0);
  });

  it('rounds to nearest ₦1000', () => {
    // -15% on ₦150,000 = ₦127,500 → ₦128,000
    const result = applyPriceChange(150_000, 'decrease_pct', 15, 1000);
    expect(result % 1000).toBe(0);
  });

  it('never produces a price below 1 Naira', () => {
    // -100% would be 0 — floor to 1
    expect(applyPriceChange(100_000, 'decrease_pct', 100, undefined)).toBeGreaterThanOrEqual(1);
  });

  it('never produces a non-integer result', () => {
    const result = applyPriceChange(133_333, 'increase_pct', 7, undefined);
    expect(Number.isInteger(result)).toBe(true);
  });
});

describe('computeBulkPreview', () => {
  const variants = [
    { id: 'v1', sku: 'IPH-256-BN', priceNgn: 1_000_000 },
    { id: 'v2', sku: 'IPH-512-BN', priceNgn: 1_200_000 },
    { id: 'v3', sku: 'SAM-256-UK', priceNgn: 800_000 },
  ];

  it('returns a preview row for each variant', () => {
    const preview = computeBulkPreview(variants, 'increase_pct', 10, 1000);
    expect(preview).toHaveLength(3);
  });

  it('includes old and new prices in each row', () => {
    const preview = computeBulkPreview(variants, 'decrease_pct', 5, undefined);
    for (const row of preview) {
      expect(row.oldPriceNgn).toBeGreaterThan(0);
      expect(row.newPriceNgn).toBeGreaterThan(0);
      expect(row.newPriceNgn).toBeLessThan(row.oldPriceNgn);
    }
  });

  it('includes variant id and SKU for identification', () => {
    const preview = computeBulkPreview(variants, 'increase_pct', 5, undefined);
    expect(preview[0]).toMatchObject({ id: 'v1', sku: 'IPH-256-BN' });
  });
});

// ---------------------------------------------------------------------------
// CSV price import
// ---------------------------------------------------------------------------

describe('parseCsvPriceRows', () => {
  it('parses a valid two-column CSV', () => {
    const csv = `sku,price_ngn\nIPH-256-BN,1650000\nSAM-512-UK,1100000`;
    const result = parseCsvPriceRows(csv);
    expect(result.rows).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
    expect(result.rows[0]).toEqual({ sku: 'IPH-256-BN', priceNgn: 1_650_000 });
  });

  it('collects row-level errors without aborting entire parse', () => {
    const csv = `sku,price_ngn\nGOOD-SKU,500000\nBAD-SKU,-100\nANOTHER-BAD,0`;
    const result = parseCsvPriceRows(csv);
    expect(result.rows).toHaveLength(1);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });

  it('rejects duplicate SKUs within the same CSV', () => {
    const csv = `sku,price_ngn\nIPH-256-BN,1000000\nIPH-256-BN,1100000`;
    const result = parseCsvPriceRows(csv);
    expect(result.errors.some((e) => e.message.toLowerCase().includes('duplicate'))).toBe(true);
  });

  it('requires the header row (sku,price_ngn)', () => {
    const csv = `IPH-256-BN,1000000`;
    const result = parseCsvPriceRows(csv);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('trims whitespace from SKU and price values', () => {
    const csv = `sku,price_ngn\n  IPH-256-BN  ,  1000000  `;
    const result = parseCsvPriceRows(csv);
    expect(result.rows[0]?.sku).toBe('IPH-256-BN');
    expect(result.rows[0]?.priceNgn).toBe(1_000_000);
  });
});

describe('CsvPriceRowSchema', () => {
  it('accepts a valid row', () => {
    expect(CsvPriceRowSchema.safeParse({ sku: 'IPH-256-BN', priceNgn: 1_000_000 }).success).toBe(true);
  });

  it('rejects empty SKU', () => {
    expect(CsvPriceRowSchema.safeParse({ sku: '', priceNgn: 500_000 }).success).toBe(false);
  });

  it('rejects zero price', () => {
    expect(CsvPriceRowSchema.safeParse({ sku: 'X', priceNgn: 0 }).success).toBe(false);
  });

  it('rejects negative price', () => {
    expect(CsvPriceRowSchema.safeParse({ sku: 'X', priceNgn: -1 }).success).toBe(false);
  });

  it('rejects non-integer price', () => {
    expect(CsvPriceRowSchema.safeParse({ sku: 'X', priceNgn: 999.99 }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Publish guard
// ---------------------------------------------------------------------------

const baseInput: PublishGuardInput = {
  name: 'Apple iPhone 15 Pro Max',
  slug: 'apple-iphone-15-pro-max',
  variants: [{ id: 'v1', priceNgn: 1_650_000, isActive: true }],
  hasPrimaryImageWithAlt: true,
};

describe('checkPublishGuard', () => {
  it('passes when all requirements are met', () => {
    const result = checkPublishGuard(baseInput);
    expect(result.canPublish).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails when name is missing', () => {
    const result = checkPublishGuard({ ...baseInput, name: '' });
    expect(result.canPublish).toBe(false);
    expect(result.errors.some((e) => e.field === 'name')).toBe(true);
  });

  it('fails when slug is missing', () => {
    const result = checkPublishGuard({ ...baseInput, slug: '' });
    expect(result.canPublish).toBe(false);
    expect(result.errors.some((e) => e.field === 'slug')).toBe(true);
  });

  it('fails when no active variants exist', () => {
    const result = checkPublishGuard({ ...baseInput, variants: [] });
    expect(result.canPublish).toBe(false);
    expect(result.errors.some((e) => e.field === 'variants')).toBe(true);
  });

  it('fails when all variants are inactive', () => {
    const result = checkPublishGuard({
      ...baseInput,
      variants: [{ id: 'v1', priceNgn: 1_000_000, isActive: false }],
    });
    expect(result.canPublish).toBe(false);
    expect(result.errors.some((e) => e.field === 'variants')).toBe(true);
  });

  it('fails when any active variant has price 0', () => {
    const result = checkPublishGuard({
      ...baseInput,
      variants: [{ id: 'v1', priceNgn: 0, isActive: true }],
    });
    expect(result.canPublish).toBe(false);
  });

  it('fails when primary image with alt text is missing', () => {
    const result = checkPublishGuard({ ...baseInput, hasPrimaryImageWithAlt: false });
    expect(result.canPublish).toBe(false);
    expect(result.errors.some((e) => e.field === 'images')).toBe(true);
  });

  it('accumulates multiple errors at once', () => {
    const result = checkPublishGuard({
      name: '',
      slug: '',
      variants: [],
      hasPrimaryImageWithAlt: false,
    });
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------------
// Specs schema
// ---------------------------------------------------------------------------

describe('SpecsSchema', () => {
  it('accepts all known spec keys', () => {
    const result = SpecsSchema.safeParse({
      display: '6.7" LTPO OLED 120Hz',
      screen_inches: '6.7',
      chip: 'A17 Pro',
      rear_camera: '48MP + 12MP + 12MP',
      front_camera: '12MP',
      battery: '4441 mAh',
      os: 'iOS 18',
      network: '5G',
      sim: 'Nano-SIM + eSIM',
      in_the_box: 'iPhone, USB-C Cable, Documentation',
    });
    expect(result.success).toBe(true);
  });

  it('accepts an empty specs object', () => {
    expect(SpecsSchema.safeParse({}).success).toBe(true);
  });

  it('accepts a partial subset of specs', () => {
    expect(SpecsSchema.safeParse({ display: '6.1" OLED', chip: 'Snapdragon 8 Gen 3' }).success).toBe(true);
  });

  it('rejects specs values that are not strings', () => {
    expect(SpecsSchema.safeParse({ screen_inches: 6.7 }).success).toBe(false);
  });
});
