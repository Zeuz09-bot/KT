/**
 * U12 — Public Order Tracking Contract Tests
 * Tests request payload validation, Order ID case-insensitivity, Nigerian phone normalization.
 * Blueprint §8.4, §10.3 U12
 */
import { describe, it, expect } from 'vitest';
import {
  publicOrderIdSchema,
  TrackOrderRequestSchema,
} from '../../lib/contracts/track';

describe('Public Order Tracking Contracts (U12)', () => {
  describe('publicOrderIdSchema', () => {
    it('accepts valid uppercase public order ID', () => {
      const res = publicOrderIdSchema.safeParse('KRN-261006-7F3KQ');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toBe('KRN-261006-7F3KQ');
      }
    });

    it('uppercases lowercase order ID automatically', () => {
      const res = publicOrderIdSchema.safeParse('krn-261006-7f3kq');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toBe('KRN-261006-7F3KQ');
      }
    });

    it('trims leading and trailing whitespace', () => {
      const res = publicOrderIdSchema.safeParse('   krn-261006-7f3kq   ');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toBe('KRN-261006-7F3KQ');
      }
    });

    it('rejects invalid order ID formats', () => {
      const invalid = [
        'ORD-261006-7F3KQ',     // wrong prefix
        'KRN-26100-7F3KQ',      // 5 digits date instead of 6
        'KRN-261006-7F3K',      // 4 chars suffix instead of 5
        'KRN-261006-7F3KQ1',    // 6 chars suffix
        'KRN-261006_7F3KQ',     // underscore separator
        '',                     // empty
        '123456',               // bogus
      ];

      for (const val of invalid) {
        expect(publicOrderIdSchema.safeParse(val).success).toBe(false);
      }
    });
  });

  describe('TrackOrderRequestSchema', () => {
    it('validates a complete tracking request and normalizes phone to E.164', () => {
      const payload = {
        publicId: 'krn-261006-7f3kq',
        phone: '08031234567',
        turnstileToken: 'test-token-valid',
      };

      const res = TrackOrderRequestSchema.safeParse(payload);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.publicId).toBe('KRN-261006-7F3KQ');
        expect(res.data.phone).toBe('+2348031234567');
      }
    });

    it('accepts phone already in E.164 format', () => {
      const payload = {
        publicId: 'KRN-261006-7F3KQ',
        phone: '+2348031234567',
      };

      const res = TrackOrderRequestSchema.safeParse(payload);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.phone).toBe('+2348031234567');
      }
    });

    it('rejects invalid phone numbers', () => {
      const payload = {
        publicId: 'KRN-261006-7F3KQ',
        phone: '06012345678', // invalid network prefix
      };

      const res = TrackOrderRequestSchema.safeParse(payload);
      expect(res.success).toBe(false);
    });

    it('rejects missing phone or missing order ID', () => {
      expect(TrackOrderRequestSchema.safeParse({ publicId: 'KRN-261006-7F3KQ' }).success).toBe(false);
      expect(TrackOrderRequestSchema.safeParse({ phone: '08031234567' }).success).toBe(false);
    });
  });
});
