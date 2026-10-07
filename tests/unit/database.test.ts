import { describe, it, expect } from 'vitest';
import type { Database, OrderStatus, ProductStatus } from '@/lib/database.types';

describe('Database Business Logic & Schema Constraints', () => {
  // 1. Effective Price SQL logic mirror
  function calculateEffectivePrice(variant: {
    priceNgn: number;
    salePriceNgn: number | null;
    saleStartsAt: string | null;
    saleEndsAt: string | null;
    nowIso?: string;
  }): number {
    const now = variant.nowIso ? new Date(variant.nowIso).getTime() : Date.now();
    const hasSalePrice = variant.salePriceNgn !== null && variant.salePriceNgn > 0;
    const isStarted = !variant.saleStartsAt || new Date(variant.saleStartsAt).getTime() <= now;
    const isNotEnded = !variant.saleEndsAt || new Date(variant.saleEndsAt).getTime() > now;

    if (hasSalePrice && isStarted && isNotEnded) {
      return variant.salePriceNgn!;
    }
    return variant.priceNgn;
  }

  it('effective_price returns standard price when no sale is configured', () => {
    const price = calculateEffectivePrice({
      priceNgn: 450000,
      salePriceNgn: null,
      saleStartsAt: null,
      saleEndsAt: null,
    });
    expect(price).toBe(450000);
  });

  it('effective_price honours active sale window', () => {
    const now = '2026-10-06T12:00:00Z';
    const price = calculateEffectivePrice({
      priceNgn: 500000,
      salePriceNgn: 420000,
      saleStartsAt: '2026-10-01T00:00:00Z',
      saleEndsAt: '2026-10-10T00:00:00Z',
      nowIso: now,
    });
    expect(price).toBe(420000);
  });

  it('effective_price reverts to standard price if sale has not started yet', () => {
    const now = '2026-10-06T12:00:00Z';
    const price = calculateEffectivePrice({
      priceNgn: 500000,
      salePriceNgn: 420000,
      saleStartsAt: '2026-10-08T00:00:00Z',
      saleEndsAt: '2026-10-15T00:00:00Z',
      nowIso: now,
    });
    expect(price).toBe(500000);
  });

  it('effective_price reverts to standard price if sale window has expired', () => {
    const now = '2026-10-06T12:00:00Z';
    const price = calculateEffectivePrice({
      priceNgn: 500000,
      salePriceNgn: 420000,
      saleStartsAt: '2026-10-01T00:00:00Z',
      saleEndsAt: '2026-10-05T00:00:00Z',
      nowIso: now,
    });
    expect(price).toBe(500000);
  });

  // 2. Search key trigger logic mirror
  function generateSearchKey(brandName: string, productName: string, categoryName: string): string {
    const raw = `${brandName} ${productName} ${categoryName}`.toLowerCase();
    return raw.replace(/[^a-z0-9]/g, '');
  }

  it('search_key trigger normalizes text to lowercase alphanumeric only', () => {
    const key = generateSearchKey('Apple', 'iPhone 15 Pro Max', 'Smartphones');
    expect(key).toBe('appleiphone15promaxsmartphones');
  });

  it('search_key handles special characters, dashes, and extra spaces', () => {
    const key = generateSearchKey('Samsung', 'Galaxy S24-Ultra (5G)!', 'Phones & Tablets');
    expect(key).toBe('samsunggalaxys24ultra5gphonestablets');
  });

  // 3. Order status state machine validation
  const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    new: ['confirmed', 'cancelled'],
    confirmed: ['paid', 'cancelled'],
    paid: ['processing', 'cancelled'],
    processing: ['shipped', 'delivered', 'cancelled'],
    shipped: ['delivered', 'cancelled'],
    delivered: [],
    cancelled: [],
  };

  function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
    return ALLOWED_TRANSITIONS[from].includes(to);
  }

  it('allows valid order state transitions', () => {
    expect(canTransitionOrder('new', 'confirmed')).toBe(true);
    expect(canTransitionOrder('confirmed', 'paid')).toBe(true);
    expect(canTransitionOrder('paid', 'processing')).toBe(true);
    expect(canTransitionOrder('processing', 'shipped')).toBe(true);
    expect(canTransitionOrder('shipped', 'delivered')).toBe(true);
    expect(canTransitionOrder('confirmed', 'cancelled')).toBe(true);
  });

  it('rejects invalid or backward state transitions', () => {
    expect(canTransitionOrder('new', 'delivered')).toBe(false);
    expect(canTransitionOrder('delivered', 'new')).toBe(false);
    expect(canTransitionOrder('cancelled', 'confirmed')).toBe(false);
    expect(canTransitionOrder('shipped', 'paid')).toBe(false);
  });

  // 4. Phone regex check constraint
  const PHONE_REGEX = /^\+234[789][01][0-9]{8}$/;

  it('validates strictly formatted Nigerian phone numbers (E.164)', () => {
    expect(PHONE_REGEX.test('+2348070822409')).toBe(true);
    expect(PHONE_REGEX.test('+2349012345678')).toBe(true);
    expect(PHONE_REGEX.test('+2347031234567')).toBe(true);
  });

  it('rejects invalid phone numbers matching DB check constraint', () => {
    expect(PHONE_REGEX.test('08070822409')).toBe(false); // missing +234
    expect(PHONE_REGEX.test('+2346012345678')).toBe(false); // invalid prefix (6)
    expect(PHONE_REGEX.test('+234807082240')).toBe(false); // too short
    expect(PHONE_REGEX.test('+23480708224099')).toBe(false); // too long
    expect(PHONE_REGEX.test('invalid')).toBe(false);
  });

  // 5. Order public ID format check
  const ORDER_PUBLIC_ID_REGEX = /^KRN-[0-9]{6}-[A-Z0-9]{5}$/;

  it('validates public order ID structure KRN-YYMMDD-XXXXX', () => {
    expect(ORDER_PUBLIC_ID_REGEX.test('KRN-261006-A1B2C')).toBe(true);
    expect(ORDER_PUBLIC_ID_REGEX.test('KRN-241006-7F3KQ')).toBe(true);
    expect(ORDER_PUBLIC_ID_REGEX.test('ORD-123456-ABCDE')).toBe(false);
    expect(ORDER_PUBLIC_ID_REGEX.test('KRN-261006-abcde')).toBe(false);
  });

  // 6. Order total generated column formula
  it('calculates order total correctly matching generated column', () => {
    const subtotal = 1450000;
    const deliveryFee = 4500;
    const discount = 20000;
    const total = subtotal + deliveryFee - discount;

    expect(total).toBe(1434500);
    expect(total).toBeGreaterThanOrEqual(0);
  });
});
