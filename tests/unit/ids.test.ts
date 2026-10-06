import { describe, it, expect } from 'vitest';
import { generatePublicOrderId, isValidPublicOrderId, ID_CHARSET } from '@/lib/ids';

describe('lib/ids', () => {
  it('generates IDs matching format KRN-YYMMDD-XXXXX', () => {
    const id = generatePublicOrderId();
    expect(id).toMatch(/^KRN-\d{6}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{5}$/);
  });

  it('contains the current UTC date in YYMMDD format', () => {
    const id = generatePublicOrderId();
    const now = new Date();
    const yy = String(now.getUTCFullYear()).slice(-2);
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(now.getUTCDate()).padStart(2, '0');
    const expectedPrefix = `KRN-${yy}${mm}${dd}-`;

    expect(id.startsWith(expectedPrefix)).toBe(true);
  });

  it('only uses allowed characters excluding look-alikes (0, O, 1, I)', () => {
    expect(ID_CHARSET).toBe('23456789ABCDEFGHJKLMNPQRSTUVWXYZ');
    expect(ID_CHARSET).not.toContain('0');
    expect(ID_CHARSET).not.toContain('O');
    expect(ID_CHARSET).not.toContain('1');
    expect(ID_CHARSET).not.toContain('I');
    expect(ID_CHARSET).toContain('L'); // Present in Blueprint §9.3 charset
  });

  it('validates IDs correctly with isValidPublicOrderId', () => {
    expect(isValidPublicOrderId('KRN-261006-7F3KQ')).toBe(true);
    expect(isValidPublicOrderId('krn-261006-7f3kq')).toBe(true); // case-insensitive verification
    expect(isValidPublicOrderId('KRN-261006-7F3K1')).toBe(false); // contains '1'
    expect(isValidPublicOrderId('KRN-261006-7F3KO')).toBe(false); // contains 'O'
    expect(isValidPublicOrderId('INVALID-ID')).toBe(false);
  });

  it('produces zero collisions across 100,000 generated IDs', () => {
    const sampleSize = 100000;
    const generated = new Set<string>();

    for (let i = 0; i < sampleSize; i++) {
      const id = generatePublicOrderId();
      generated.add(id);
    }

    expect(generated.size).toBe(sampleSize);
  });
});
