/**
 * U10 — Orders Contract & Validation Tests
 * Tests request payload validation, phone normalization, delivery requirements, and line limits.
 * Blueprint §8.3, §10.3
 */
import { describe, it, expect } from 'vitest';
import {
  CreateOrderRequestSchema,
  NIGERIAN_STATES,
} from '../../lib/contracts/orders';

describe('CreateOrderRequestSchema', () => {
  const validOrder = {
    idempotencyKey: '3f2b6c1e-8b1c-4d7e-9a6a-0e8a5c8d1a11',
    turnstileToken: 'test-token-valid-abc12345',
    customer: {
      name: 'Ade Bello',
      phone: '08031234567',
    },
    fulfilment: 'delivery' as const,
    delivery: {
      state: 'Oyo',
      city: 'Ibadan',
      address: '12 Example Street, Bodija',
    },
    note: 'Call before delivery',
    items: [
      {
        variantId: '550e8400-e29b-41d4-a716-446655440000',
        qty: 1,
        expectedUnitPriceNgn: 1650000,
      },
    ],
    expectedTotalNgn: 1650000,
  };

  it('validates a correct delivery order', () => {
    const res = CreateOrderRequestSchema.safeParse(validOrder);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.customer.phone).toBe('+2348031234567');
    }
  });

  it('validates a correct pickup order without delivery address', () => {
    const pickupOrder = {
      ...validOrder,
      fulfilment: 'pickup' as const,
      delivery: undefined,
    };
    const res = CreateOrderRequestSchema.safeParse(pickupOrder);
    expect(res.success).toBe(true);
  });

  it('normalizes local Nigerian phone formats to E.164 (+234...)', () => {
    const cases = [
      { input: '08031234567', expected: '+2348031234567' },
      { input: '+2348031234567', expected: '+2348031234567' },
      { input: '2348031234567', expected: '+2348031234567' },
      { input: '09012345678', expected: '+2349012345678' },
      { input: '07034567890', expected: '+2347034567890' },
    ];

    for (const { input, expected } of cases) {
      const parsed = CreateOrderRequestSchema.safeParse({
        ...validOrder,
        customer: { ...validOrder.customer, phone: input },
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.customer.phone).toBe(expected);
      }
    }
  });

  it('rejects invalid Nigerian phone numbers', () => {
    const invalidPhones = ['12345', '06012345678', '+14155552671', 'abc', '080312345'];
    for (const phone of invalidPhones) {
      const parsed = CreateOrderRequestSchema.safeParse({
        ...validOrder,
        customer: { ...validOrder.customer, phone },
      });
      expect(parsed.success).toBe(false);
    }
  });

  it('requires delivery address fields when fulfilment is delivery', () => {
    const missingDelivery = {
      ...validOrder,
      fulfilment: 'delivery' as const,
      delivery: undefined,
    };
    const parsed = CreateOrderRequestSchema.safeParse(missingDelivery);
    expect(parsed.success).toBe(false);
  });

  it('rejects invalid Nigerian states', () => {
    const invalidState = {
      ...validOrder,
      delivery: {
        ...validOrder.delivery,
        state: 'Texas',
      },
    };
    const parsed = CreateOrderRequestSchema.safeParse(invalidState);
    expect(parsed.success).toBe(false);
  });

  it('rejects customer name that is too short or too long', () => {
    const shortName = {
      ...validOrder,
      customer: { ...validOrder.customer, name: 'A' },
    };
    expect(CreateOrderRequestSchema.safeParse(shortName).success).toBe(false);

    const longName = {
      ...validOrder,
      customer: { ...validOrder.customer, name: 'A'.repeat(61) },
    };
    expect(CreateOrderRequestSchema.safeParse(longName).success).toBe(false);
  });

  it('rejects order note exceeding 300 characters', () => {
    const longNote = {
      ...validOrder,
      note: 'x'.repeat(301),
    };
    expect(CreateOrderRequestSchema.safeParse(longNote).success).toBe(false);
  });

  it('rejects order with zero items or more than 10 items', () => {
    const zeroItems = { ...validOrder, items: [] };
    expect(CreateOrderRequestSchema.safeParse(zeroItems).success).toBe(false);

    const elevenItems = {
      ...validOrder,
      items: Array.from({ length: 11 }, (_, i) => ({
        variantId: '550e8400-e29b-41d4-a716-446655440000',
        qty: 1,
        expectedUnitPriceNgn: 100000,
      })),
    };
    expect(CreateOrderRequestSchema.safeParse(elevenItems).success).toBe(false);
  });

  it('verifies that NIGERIAN_STATES contains 37 entries (36 states + FCT)', () => {
    expect(NIGERIAN_STATES.length).toBe(37);
    expect(NIGERIAN_STATES).toContain('Lagos');
    expect(NIGERIAN_STATES).toContain('Ondo');
    expect(NIGERIAN_STATES).toContain('FCT - Abuja');
  });
});
