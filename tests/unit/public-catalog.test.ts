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
      storage_gb: 128,
      color: 'Black',
      condition: 'brand_new',
      price_ngn: 100000,
      stock_qty: 5,
    },
    {
      id: 'v2',
      storage_gb: 256,
      color: 'White',
      condition: 'brand_new',
      price_ngn: 120000,
      stock_qty: 0,
    },
    {
      id: 'v3',
      storage_gb: 128,
      color: 'White',
      condition: 'uk_used',
      price_ngn: 80000,
      stock_qty: 2,
    },
  ] as any[];

  describe('resolveVariant', () => {
    it('returns the cheapest in-stock variant if no selection is provided', () => {
      const result = resolveVariant(mockVariants, {});
      expect(result?.id).toBe('v3'); // 80k is cheapest in-stock
    });

    it('returns the cheapest variant overall if all are out of stock', () => {
      const outOfStock = mockVariants.map(v => ({ ...v, stock_qty: 0 }));
      const result = resolveVariant(outOfStock, {});
      expect(result?.id).toBe('v3');
    });

    it('matches exact selection', () => {
      const result = resolveVariant(mockVariants, { storage_gb: 256, condition: 'brand_new' });
      expect(result?.id).toBe('v2');
    });

    it('falls back to closest match if exact match is unavailable', () => {
      // e.g. user selected 256GB Black uk_used (does not exist)
      // should probably return something with 256GB or Black
      const result = resolveVariant(mockVariants, { storage_gb: 256, color: 'Black' });
      // Should ideally pick v2 (has 256GB) or v1 (has Black)
      expect(['v1', 'v2']).toContain(result?.id);
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
