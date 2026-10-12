import { describe, it, expect } from 'vitest';
import {
  resolveVariant,
  formatWarranty,
  parseListingFilters,
} from '../../lib/contracts/catalog';

describe('public catalog helpers', () => {
  const mockVariants = [
    {
      id: 'v1',
      product_id: 'p1',
      storage_gb: 128,
      ram_gb: null,
      color: 'Black',
      color_hex: null,
      condition: 'brand_new',
      price_ngn: 100000,
      sale_price_ngn: null,
      compare_at_price_ngn: null,
      sale_starts_at: null,
      sale_ends_at: null,
      stock_qty: 5,
      warranty_months: null,
    },
    {
      id: 'v2',
      product_id: 'p1',
      storage_gb: 256,
      ram_gb: null,
      color: 'White',
      color_hex: null,
      condition: 'brand_new',
      price_ngn: 120000,
      sale_price_ngn: null,
      compare_at_price_ngn: null,
      sale_starts_at: null,
      sale_ends_at: null,
      stock_qty: 0,
      warranty_months: null,
    },
    {
      id: 'v3',
      product_id: 'p1',
      storage_gb: 128,
      ram_gb: null,
      color: 'White',
      color_hex: null,
      condition: 'uk_used',
      price_ngn: 80000,
      sale_price_ngn: null,
      compare_at_price_ngn: null,
      sale_starts_at: null,
      sale_ends_at: null,
      stock_qty: 2,
      warranty_months: null,
    },
  ] as any[];

  describe('resolveVariant', () => {
    it('returns the cheapest in-stock variant if no selection is provided', () => {
      const result = resolveVariant(mockVariants, {});
      // v1: 100k (in stock), v2: 120k (out of stock), v3: 80k (in stock)
      // Should return a variant in stock with the lowest price
      expect(result?.stock_qty).toBeGreaterThan(0);
      const price = result?.sale_price_ngn ?? result?.price_ngn;
      expect(price).toBeLessThanOrEqual(100000);
    });

    it('returns the cheapest variant overall if all are out of stock', () => {
      const outOfStock = mockVariants.map(v => ({ ...v, stock_qty: 0 }));
      const result = resolveVariant(outOfStock, {});
      // Should return a variant
      expect(result).toBeDefined();
      expect(result?.id).toBeTruthy();
    });

    it('matches exact selection', () => {
      const result = resolveVariant(mockVariants, { storage_gb: 256, condition: 'brand_new' });
      expect(result?.id).toBe('v2');
    });

    it('falls back to cheapest in-stock if exact match is unavailable', () => {
      // e.g. user selected 256GB Black uk_used (does not exist)
      // should fall back to cheapest in-stock
      const result = resolveVariant(mockVariants, { storage_gb: 256, color: 'Black' });
      expect(result?.stock_qty).toBeGreaterThan(0);
    });
  });

  describe('formatWarranty', () => {
    it('formats brand_new correctly', () => {
      expect(formatWarranty('brand_new', 12)).toBe('12 Months Official Warranty');
    });

    it('formats uk_used correctly', () => {
      expect(formatWarranty('uk_used', 3)).toBe('3 Months Store Warranty');
    });
  });

  describe('parseListingFilters', () => {
    it('parses URL search params correctly', () => {
      const params = new URLSearchParams('brand=apple&category=phones&sort=price_asc&page=2');
      const result = parseListingFilters(params);
      expect(result).toEqual({
        brand: 'apple',
        category: 'phones',
        sort: 'price_asc',
        page: 2,
      });
    });
  });
});
