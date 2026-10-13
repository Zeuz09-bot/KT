/**
 * U10 — Orders API & Tamper Resistance Tests
 * Tests POST /api/orders logic, price verification, rate-limiting, and WhatsApp handoff.
 * Blueprint §10.3 (Definition of Done)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as createOrderHandler } from '../../app/api/orders/route';
import { POST as handoffHandler } from '../../app/api/orders/handoff/route';
import { signHandoffToken } from '../../lib/handoffToken';
import { resetRateLimit } from '../../lib/rateLimit';

// Mock Supabase admin client
const mockRpc = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    rpc: mockRpc,
    from: mockFrom,
  }),
}));

vi.mock('@/modules/security/blocklist', () => ({
  isBlocked: vi.fn().mockResolvedValue({ blocked: false }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  // Clear in-memory rate limiter between tests
  resetRateLimit('orders-ip:test-ip');
  resetRateLimit('handoff-ip:test-ip');
});

function makeOrderRequest(body: unknown, ip = '127.0.0.1') {
  return new NextRequest('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(body),
  });
}

function makeHandoffRequest(body: unknown, ip = '127.0.0.1') {
  return new NextRequest('http://localhost:3000/api/orders/handoff', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(body),
  });
}

const validPayload = {
  idempotencyKey: '3f2b6c1e-8b1c-4d7e-9a6a-0e8a5c8d1a11',
  turnstileToken: 'test-token-auto-approved',
  customer: {
    name: 'Ade Bello',
    phone: '08031234567',
  },
  fulfilment: 'delivery',
  delivery: {
    state: 'Lagos',
    city: 'Ikeja',
    address: '15 Allen Avenue',
  },
  note: 'Leave with security',
  items: [
    {
      variantId: '550e8400-e29b-41d4-a716-446655440000',
      qty: 1,
      expectedUnitPriceNgn: 1650000,
    },
  ],
  expectedTotalNgn: 1650000,
};

describe('POST /api/orders', () => {
  it('creates order and returns 201 with WhatsApp URL and handoff token', async () => {
    // 1. Mock phone open count
    mockFrom.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ count: 0 }),
        }),
      }),
    });

    // 2. Mock create_order RPC
    mockRpc.mockResolvedValueOnce({
      data: {
        ok: true,
        data: {
          order_id: 'ord-1234-uuid',
          public_id: 'KRN-261013-ABC78',
          status: 'new',
          total_ngn: 1650000,
        },
      },
      error: null,
    });

    // 3. Mock order_items fetch
    mockFrom.mockReturnValueOnce({
      select: () => ({
        eq: () =>
          Promise.resolve({
            data: [
              {
                product_name: 'iPhone 15 Pro Max',
                variant_label: '256GB · Natural Titanium · Brand New',
                qty: 1,
                unit_price_ngn: 1650000,
              },
            ],
          }),
      }),
    });

    // 4. Mock site_settings fetch
    mockFrom.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: { value: { phone: '+2348070822409' } },
            }),
        }),
      }),
    });

    const req = makeOrderRequest(validPayload);
    const res = await createOrderHandler(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.publicId).toBe('KRN-261013-ABC78');
    expect(json.data.totalNgn).toBe(1650000);
    expect(json.data.whatsappUrl).toContain('https://wa.me/2348070822409?text=');
    expect(json.data.handoffToken).toBeDefined();
  });

  it('Definition of Done: Tampering test yields 409 PRICE_CHANGED on expected total mismatch', async () => {
    mockFrom.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ count: 0 }),
        }),
      }),
    });

    // RPC rejects tampered price
    mockRpc.mockResolvedValueOnce({
      data: {
        ok: false,
        error: {
          code: 'PRICE_CHANGED',
          message: 'Prices have been updated since you viewed the items.',
          details: { current_total: 1650000, expected_total: 1000 },
        },
      },
      error: null,
    });

    const tamperedPayload = {
      ...validPayload,
      expectedTotalNgn: 1000, // Client tried to submit 1,000 Naira instead of 1,650,000
    };

    const req = makeOrderRequest(tamperedPayload);
    const res = await createOrderHandler(req);
    expect(res.status).toBe(409);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('PRICE_CHANGED');
  });

  it('Definition of Done: 6th order attempt within one hour from same IP receives 429 RATE_LIMITED', async () => {
    const fixedIp = '192.168.1.100';

    for (let i = 0; i < 5; i++) {
      mockFrom.mockReturnValueOnce({
        select: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ count: 0 }),
          }),
        }),
      });

      mockRpc.mockResolvedValueOnce({
        data: {
          ok: true,
          data: {
            order_id: `ord-${i}`,
            public_id: `KRN-261013-A000${i}`,
            status: 'new',
            total_ngn: 1650000,
          },
        },
        error: null,
      });

      mockFrom.mockReturnValueOnce({
        select: () => ({
          eq: () => Promise.resolve({ data: [] }),
        }),
      });

      mockFrom.mockReturnValueOnce({
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: null }),
          }),
        }),
      });

      const req = makeOrderRequest({ ...validPayload, idempotencyKey: crypto.randomUUID() }, fixedIp);
      const res = await createOrderHandler(req);
      expect(res.status).toBe(201);
    }

    // 6th attempt
    const req6 = makeOrderRequest({ ...validPayload, idempotencyKey: crypto.randomUUID() }, fixedIp);
    const res6 = await createOrderHandler(req6);
    expect(res6.status).toBe(429);

    const json6 = await res6.json();
    expect(json6.error.code).toBe('RATE_LIMITED');
  });

  it('rejects order if phone already has 5 open pending orders', async () => {
    mockFrom.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ count: 5 }),
        }),
      }),
    });

    const req = makeOrderRequest(validPayload, '10.0.0.1');
    const res = await createOrderHandler(req);
    expect(res.status).toBe(429);

    const json = await res.json();
    expect(json.error.code).toBe('TOO_MANY_OPEN_ORDERS');
  });
});

describe('POST /api/orders/handoff', () => {
  it('successfully records handoff for valid token', async () => {
    const publicId = 'KRN-261013-ABC78';
    const orderId = 'ord-1234';
    const token = signHandoffToken(publicId, orderId);

    mockFrom.mockReturnValueOnce({
      update: () => ({
        eq: () => ({
          is: () => Promise.resolve({ error: null }),
        }),
      }),
    });

    const req = makeHandoffRequest({ publicId, token });
    const res = await handoffHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.marked).toBe(true);
  });

  it('rejects tampered or invalid handoff token with 403', async () => {
    const req = makeHandoffRequest({
      publicId: 'KRN-261013-ABC78',
      token: 'fake.signature.token',
    });
    const res = await handoffHandler(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error.code).toBe('INVALID_TOKEN');
  });
});
