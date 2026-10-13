/**
 * U09 — List resolve contracts & validation tests
 * Tests request payload validation and response schema.
 */
import { describe, it, expect } from 'vitest';
import {
  ResolveListRequestSchema,
  ResolvedLineSchema,
  ORDER_LIST_MAX_LINES,
  ORDER_LIST_MAX_QTY,
} from '../../lib/contracts/list';

describe('ResolveListRequestSchema', () => {
  it('validates a valid list resolution request', () => {
    const valid = {
      items: [
        { variantId: '550e8400-e29b-41d4-a716-446655440000', qty: 2 },
        { variantId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8', qty: 1 },
      ],
    };
    const parsed = ResolveListRequestSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it('rejects an empty items array', () => {
    const invalid = { items: [] };
    const parsed = ResolveListRequestSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('rejects items exceeding max lines (10)', () => {
    const tooMany = {
      items: Array.from({ length: ORDER_LIST_MAX_LINES + 1 }, (_, i) => ({
        variantId: '550e8400-e29b-41d4-a716-446655440000',
        qty: 1,
      })),
    };
    const parsed = ResolveListRequestSchema.safeParse(tooMany);
    expect(parsed.success).toBe(false);
  });

  it('rejects quantity greater than max qty (5)', () => {
    const invalidQty = {
      items: [
        { variantId: '550e8400-e29b-41d4-a716-446655440000', qty: ORDER_LIST_MAX_QTY + 1 },
      ],
    };
    const parsed = ResolveListRequestSchema.safeParse(invalidQty);
    expect(parsed.success).toBe(false);
  });

  it('rejects non-UUID variant IDs', () => {
    const invalidId = {
      items: [{ variantId: 'not-a-uuid', qty: 1 }],
    };
    const parsed = ResolveListRequestSchema.safeParse(invalidId);
    expect(parsed.success).toBe(false);
  });
});

describe('ResolvedLineSchema', () => {
  it('validates a correctly resolved line', () => {
    const line = {
      variantId: '550e8400-e29b-41d4-a716-446655440000',
      productSlug: 'iphone-16-pro',
      name: 'iPhone 16 Pro',
      label: '128GB · Natural Titanium · Brand New',
      imageUrl: '/images/products/iphone-16.webp',
      unitPriceNgn: 1650000,
      qty: 2,
      available: true,
      maxQty: 5,
      priceChangedSinceAdded: false,
    };
    const parsed = ResolvedLineSchema.safeParse(line);
    expect(parsed.success).toBe(true);
  });
});
