import { describe, it, expect } from 'vitest';
import {
  normalizePhoneNg,
  validatePhoneNg,
  formatPhoneDisplay,
  maskPhone,
} from '@/lib/phone';

describe('lib/phone', () => {
  describe('normalizePhoneNg', () => {
    it('normalizes local 11-digit numbers starting with 0', () => {
      expect(normalizePhoneNg('08031234567')).toBe('+2348031234567');
      expect(normalizePhoneNg('08070822409')).toBe('+2348070822409');
      expect(normalizePhoneNg('07012345678')).toBe('+2347012345678');
      expect(normalizePhoneNg('09098765432')).toBe('+2349098765432');
    });

    it('normalizes 10-digit numbers missing the leading 0', () => {
      expect(normalizePhoneNg('8031234567')).toBe('+2348031234567');
      expect(normalizePhoneNg('8070822409')).toBe('+2348070822409');
    });

    it('normalizes international format with or without plus', () => {
      expect(normalizePhoneNg('+2348031234567')).toBe('+2348031234567');
      expect(normalizePhoneNg('2348031234567')).toBe('+2348031234567');
    });

    it('handles accidental leading zero after international code +234080...', () => {
      expect(normalizePhoneNg('+23408070822409')).toBe('+2348070822409');
      expect(normalizePhoneNg('23408070822409')).toBe('+2348070822409');
    });

    it('strips whitespaces, dashes, dots, and parentheses', () => {
      expect(normalizePhoneNg('0803 123 4567')).toBe('+2348031234567');
      expect(normalizePhoneNg('+234-807-082-2409')).toBe('+2348070822409');
      expect(normalizePhoneNg('(0803) 123-4567')).toBe('+2348031234567');
      expect(normalizePhoneNg(' 0807.082.2409 ')).toBe('+2348070822409');
    });

    it('throws or returns null/error for invalid phone numbers', () => {
      expect(() => normalizePhoneNg('12345')).toThrow(/invalid/i);
      expect(() => normalizePhoneNg('06031234567')).toThrow(/invalid/i); // invalid prefix
      expect(() => normalizePhoneNg('+15551234567')).toThrow(/invalid/i); // non-Nigerian
      expect(() => normalizePhoneNg('abcdefghijk')).toThrow(/invalid/i);
    });
  });

  describe('validatePhoneNg', () => {
    it('returns true for valid Nigerian phone numbers', () => {
      expect(validatePhoneNg('+2348031234567')).toBe(true);
      expect(validatePhoneNg('08070822409')).toBe(true);
      expect(validatePhoneNg('+234-807-082-2409')).toBe(true);
    });

    it('returns false for invalid numbers', () => {
      expect(validatePhoneNg('080312345')).toBe(false);
      expect(validatePhoneNg('0803123456789')).toBe(false);
      expect(validatePhoneNg('invalid')).toBe(false);
      expect(validatePhoneNg('')).toBe(false);
    });
  });

  describe('formatPhoneDisplay', () => {
    it('formats E.164 phone into local display format: 0803 123 4567', () => {
      expect(formatPhoneDisplay('+2348031234567')).toBe('0803 123 4567');
      expect(formatPhoneDisplay('+2348070822409')).toBe('0807 082 2409');
    });
  });

  describe('maskPhone', () => {
    it('masks Nigerian phone numbers for safe logging and display', () => {
      expect(maskPhone('+2348070822409')).toBe('+23480****2409');
      expect(maskPhone('08031234567')).toBe('+23480****4567');
    });
  });
});
