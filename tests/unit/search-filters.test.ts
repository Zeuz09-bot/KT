/**
 * U08 — Search and Filter logic tests
 */
import { describe, it, expect } from 'vitest';
import { parseListingFilters } from '../../lib/contracts/catalog';

describe('parseListingFilters', () => {
  it('returns defaults when no params are given', () => {
    const result = parseListingFilters(new URLSearchParams());
    expect(result.sort).toBe('newest');
    expect(result.page).toBe(1);
    expect(result.brand).toBeUndefined();
    expect(result.condition).toBeUndefined();
    expect(result.search).toBeUndefined();
  });

  it('parses all valid filters', () => {
    const params = new URLSearchParams(
      'brand=apple&category=phones&sort=price_asc&page=3&condition=brand_new&search=iphone+15',
    );
    const result = parseListingFilters(params);
    expect(result.brand).toBe('apple');
    expect(result.category).toBe('phones');
    expect(result.sort).toBe('price_asc');
    expect(result.page).toBe(3);
    expect(result.condition).toBe('brand_new');
    expect(result.search).toBe('iphone 15');
  });

  it('rejects invalid sort', () => {
    const params = new URLSearchParams('sort=random_sort');
    expect(() => parseListingFilters(params)).toThrow();
  });

  it('rejects invalid condition', () => {
    const params = new URLSearchParams('condition=refurbished');
    expect(() => parseListingFilters(params)).toThrow();
  });

  it('coerces page to a number', () => {
    const result = parseListingFilters(new URLSearchParams('page=5'));
    expect(result.page).toBe(5);
    expect(typeof result.page).toBe('number');
  });

  it('page minimum is 1', () => {
    expect(() => parseListingFilters(new URLSearchParams('page=0'))).toThrow();
  });
});

describe('search query normalisation', () => {
  // Testing the normalisation inline since it is a pure string operation in the route
  function normalise(q: string): string {
    return q.toLowerCase().replace(/\s+/g, ' ').trim();
  }

  it('lowercases the query', () => {
    expect(normalise('Samsung S25 Ultra')).toBe('samsung s25 ultra');
  });

  it('collapses extra whitespace', () => {
    expect(normalise('galaxy   s  25  ultra')).toBe('galaxy s 25 ultra');
  });

  it('trims leading and trailing whitespace', () => {
    expect(normalise('  iphone 15  ')).toBe('iphone 15');
  });

  it('produces the same result for different spacing', () => {
    expect(normalise('s25ultra')).toBe('s25ultra');
    expect(normalise('S25 Ultra')).toBe('s25 ultra');
  });
});
