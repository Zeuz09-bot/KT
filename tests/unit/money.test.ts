import { describe, it, expect } from 'vitest';
import { formatNgn, parseNgn, assertIntegerNaira } from '@/lib/money';

describe('lib/money', () => {
  describe('formatNgn', () => {
    it('formats positive integers as Nigerian Naira without decimals', () => {
      expect(formatNgn(1650000)).toBe('₦1,650,000');
      expect(formatNgn(999)).toBe('₦999');
      expect(formatNgn(50)).toBe('₦50');
      expect(formatNgn(0)).toBe('₦0');
    });

    it('handles large amounts correctly', () => {
      expect(formatNgn(100000000)).toBe('₦100,000,000');
    });

    it('throws when given non-integer amounts to prevent float errors', () => {
      expect(() => formatNgn(1250.5)).toThrow(/integer/i);
      expect(() => formatNgn(99.99)).toThrow(/integer/i);
      expect(() => formatNgn(NaN)).toThrow(/integer/i);
      expect(() => formatNgn(Infinity)).toThrow(/integer/i);
    });

    it('throws when given negative amounts if not allowed', () => {
      expect(() => formatNgn(-500)).toThrow(/non-negative/i);
    });
  });

  describe('parseNgn', () => {
    it('parses formatted currency strings into integer Naira', () => {
      expect(parseNgn('₦1,650,000')).toBe(1650000);
      expect(parseNgn('1,650,000')).toBe(1650000);
      expect(parseNgn('₦ 500')).toBe(500);
      expect(parseNgn('₦0')).toBe(0);
    });

    it('rejects decimal inputs in string representations', () => {
      expect(() => parseNgn('₦1,650,000.50')).toThrow(/integer/i);
    });

    it('throws on invalid text', () => {
      expect(() => parseNgn('abc')).toThrow(/invalid/i);
      expect(() => parseNgn('')).toThrow(/invalid/i);
    });
  });

  describe('assertIntegerNaira', () => {
    it('validates strictly that money is integer', () => {
      expect(() => assertIntegerNaira(5000)).not.toThrow();
      expect(() => assertIntegerNaira(0)).not.toThrow();
      expect(() => assertIntegerNaira(5000.25)).toThrow(/integer/i);
    });
  });
});
