import { describe, it, expect } from 'vitest';
import {
  formatLagosDate,
  formatLagosDateTime,
  formatLagosTime,
} from '@/lib/dates';

describe('lib/dates', () => {
  it('formats UTC timestamptz in Africa/Lagos time (UTC+1)', () => {
    // 10:15 UTC is 11:15 in Lagos
    const utcString = '2026-10-06T10:15:00Z';
    expect(formatLagosDateTime(utcString)).toMatch(/06 Oct 2026, 11:15/);
    expect(formatLagosDate(utcString)).toBe('06 Oct 2026');
    expect(formatLagosTime(utcString)).toBe('11:15');
  });

  it('handles cross-midnight timezone offsets correctly', () => {
    // 23:30 UTC on 05 Oct is 00:30 on 06 Oct in Lagos
    const utcString = '2026-10-05T23:30:00Z';
    expect(formatLagosDate(utcString)).toBe('06 Oct 2026');
    expect(formatLagosTime(utcString)).toBe('00:30');
  });

  it('accepts Date objects as well as ISO strings', () => {
    const date = new Date('2026-01-15T08:00:00Z');
    expect(formatLagosTime(date)).toBe('09:00');
  });
});
