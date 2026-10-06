import { describe, it, expect } from 'vitest';
import {
  ok,
  err,
  AppError,
  ERROR_HTTP_STATUS,
  type ErrorCode,
} from '@/lib/result';

describe('lib/result', () => {
  it('creates success envelopes with ok()', () => {
    const result = ok({ orderId: 'KRN-123' });
    expect(result).toEqual({
      ok: true,
      data: { orderId: 'KRN-123' },
    });
  });

  it('creates error envelopes with err()', () => {
    const result = err('PRICE_CHANGED', 'Prices were updated.', { diff: 500 });
    expect(result).toEqual({
      ok: false,
      error: {
        code: 'PRICE_CHANGED',
        message: 'Prices were updated.',
        details: { diff: 500 },
      },
    });
  });

  it('instantiates AppError with correct status code mappings', () => {
    const priceErr = new AppError('PRICE_CHANGED', 'Price has changed');
    expect(priceErr.code).toBe('PRICE_CHANGED');
    expect(priceErr.statusCode).toBe(409);

    const valErr = new AppError('VALIDATION_FAILED', 'Invalid input');
    expect(valErr.statusCode).toBe(422);

    const rateErr = new AppError('RATE_LIMITED', 'Too many requests');
    expect(rateErr.statusCode).toBe(429);

    const authErr = new AppError('UNAUTHENTICATED', 'Sign in required');
    expect(authErr.statusCode).toBe(401);

    const forbiddenErr = new AppError('FORBIDDEN', 'Access denied');
    expect(forbiddenErr.statusCode).toBe(403);
  });

  it('contains all 14 error codes defined in Blueprint §8.1', () => {
    const expectedCodes: ErrorCode[] = [
      'VALIDATION_FAILED',
      'CAPTCHA_FAILED',
      'RATE_LIMITED',
      'BLOCKED',
      'ORDERS_DISABLED',
      'OUT_OF_STOCK',
      'PRICE_CHANGED',
      'ITEM_UNAVAILABLE',
      'NOT_FOUND',
      'UNAUTHENTICATED',
      'FORBIDDEN',
      'INVALID_TRANSITION',
      'INSUFFICIENT_STOCK',
      'INTERNAL',
    ];

    for (const code of expectedCodes) {
      expect(ERROR_HTTP_STATUS[code]).toBeDefined();
    }
  });
});
