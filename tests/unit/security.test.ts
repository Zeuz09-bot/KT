/**
 * Unit U15: Security Hardening Test Suite
 *
 * Blueprint §10.3 (U15 Definition of Done) & §12:
 * 1. Security Headers & Strict CSP verification
 * 2. Centralized rate limiting policy enforcement
 * 3. Scripted abuse test (1,000 order attempts, 500 track attempts throttled)
 * 4. Cloudflare Turnstile fail-closed verification
 * 5. Blocklist enforcement (phone and IP hash blocking)
 * 6. Admin privilege escalation guards (Staff blocked from Owner actions)
 * 7. Log redaction tests (no PII, masked phones, hashed IPs, redacted tokens)
 * 8. Owner security alerts recording
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import nextConfig from '../../next.config';
import {
  RATE_LIMIT_POLICIES,
  checkPolicyRateLimit,
  checkRateLimit,
  resetRateLimit,
  clearAllRateLimits,
} from '@/lib/rateLimit';
import { verifyTurnstile } from '@/lib/turnstile';
import { isBlocked } from '@/modules/security/blocklist';
import { recordOwnerAlert } from '@/modules/security/alerts';
import { maskPhone } from '@/lib/phone';
import { hashIp, logger } from '@/lib/logger';
import { verifyOwnerAccess } from '@/modules/auth/guards';
import { AppError } from '@/lib/result';

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock Supabase admin
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: mockFrom,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  clearAllRateLimits();
});

describe('1. Security Headers & Strict CSP Configuration', () => {
  it('defines all required headers for all routes (/:path*)', async () => {
    expect(nextConfig.headers).toBeDefined();
    const headerConfigs = await nextConfig.headers!();
    const globalConfig = headerConfigs.find((c) => c.source === '/:path*');

    expect(globalConfig).toBeDefined();
    const headersMap = new Map(globalConfig!.headers.map((h) => [h.key, h.value]));

    // HSTS
    expect(headersMap.get('Strict-Transport-Security')).toContain('max-age=63072000');
    expect(headersMap.get('Strict-Transport-Security')).toContain('includeSubDomains');
    expect(headersMap.get('Strict-Transport-Security')).toContain('preload');

    // Clickjacking defense
    expect(headersMap.get('X-Frame-Options')).toBe('DENY');

    // MIME sniffing defense
    expect(headersMap.get('X-Content-Type-Options')).toBe('nosniff');

    // Referrer policy
    expect(headersMap.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');

    // Permissions policy
    const permissions = headersMap.get('Permissions-Policy');
    expect(permissions).toContain('camera=()');
    expect(permissions).toContain('microphone=()');
    expect(permissions).toContain('geolocation=()');

    // CSP with frame-ancestors none and Turnstile allowance
    const csp = headersMap.get('Content-Security-Policy');
    expect(csp).toBeDefined();
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain('https://challenges.cloudflare.com');
  });

  it('sets X-Robots-Tag: noindex, nofollow on /admin/:path*', async () => {
    const headerConfigs = await nextConfig.headers!();
    const adminConfig = headerConfigs.find((c) => c.source === '/admin/:path*');

    expect(adminConfig).toBeDefined();
    const headersMap = new Map(adminConfig!.headers.map((h) => [h.key, h.value]));
    expect(headersMap.get('X-Robots-Tag')).toBe('noindex, nofollow');
  });
});

describe('2. Centralized Rate Limiting Policies', () => {
  it('defines policies conforming to Blueprint requirements', () => {
    expect(RATE_LIMIT_POLICIES.orders).toEqual({ limit: 5, windowMs: 3600000 });
    expect(RATE_LIMIT_POLICIES.handoff).toEqual({ limit: 10, windowMs: 3600000 });
    expect(RATE_LIMIT_POLICIES.trackIp).toEqual({ limit: 10, windowMs: 60000 });
    expect(RATE_LIMIT_POLICIES.trackOrder).toEqual({ limit: 5, windowMs: 600000 });
    expect(RATE_LIMIT_POLICIES.search).toEqual({ limit: 30, windowMs: 60000 });
    expect(RATE_LIMIT_POLICIES.login).toEqual({ limit: 5, windowMs: 900000 });
  });

  it('correctly tracks and decrements remaining quota', () => {
    const ip = 'test-ip-rate-check';

    const r1 = checkPolicyRateLimit('orders', ip);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(4);

    const r2 = checkPolicyRateLimit('orders', ip);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(3);

    resetRateLimit(`orders:${ip}`);
    const rReset = checkPolicyRateLimit('orders', ip);
    expect(rReset.allowed).toBe(true);
    expect(rReset.remaining).toBe(4);
  });
});

describe('3. Scripted Abuse Tests (Blueprint DoD: 1000 orders, 500 track requests)', () => {
  it('throttles 1,000 rapid order attempts from one IP (5 allowed, 995 throttled)', () => {
    const abuserIp = '198.51.100.44';
    let allowedCount = 0;
    let throttledCount = 0;

    for (let i = 0; i < 1000; i++) {
      const res = checkPolicyRateLimit('orders', abuserIp);
      if (res.allowed) {
        allowedCount++;
      } else {
        throttledCount++;
      }
    }

    expect(allowedCount).toBe(5);
    expect(throttledCount).toBe(995);

    // Verify legitimate user from a different IP is completely unaffected
    const legitimateUser = checkPolicyRateLimit('orders', '203.0.113.10');
    expect(legitimateUser.allowed).toBe(true);
    expect(legitimateUser.remaining).toBe(4);
  });

  it('throttles 500 rapid track attempts from one IP (10 allowed, 490 throttled)', () => {
    const abuserIp = '198.51.100.55';
    let allowedCount = 0;
    let throttledCount = 0;

    for (let i = 0; i < 500; i++) {
      const res = checkPolicyRateLimit('trackIp', abuserIp);
      if (res.allowed) {
        allowedCount++;
      } else {
        throttledCount++;
      }
    }

    expect(allowedCount).toBe(10);
    expect(throttledCount).toBe(490);
  });

  it('throttles 500 rapid track attempts for a single Order ID (5 allowed, 495 throttled)', () => {
    const targetOrderId = 'KRN-261013-ABC99';
    let allowedCount = 0;
    let throttledCount = 0;

    for (let i = 0; i < 500; i++) {
      const res = checkPolicyRateLimit('trackOrder', targetOrderId);
      if (res.allowed) {
        allowedCount++;
      } else {
        throttledCount++;
      }
    }

    expect(allowedCount).toBe(5);
    expect(throttledCount).toBe(495);
  });
});

describe('4. Cloudflare Turnstile Verification (Fail Closed)', () => {
  it('allows auto-approved test token in development and tests', async () => {
    const valid = await verifyTurnstile('test-token-auto-approved', '127.0.0.1');
    expect(valid).toBe(true);
  });

  it('allows Cloudflare official dummy pass token 1x00000000000000000000AA', async () => {
    const valid = await verifyTurnstile('1x00000000000000000000AA', '127.0.0.1');
    expect(valid).toBe(true);
  });

  it('rejects Cloudflare official dummy fail token 2x00000000000000000000AB', async () => {
    const valid = await verifyTurnstile('2x00000000000000000000AB', '127.0.0.1');
    expect(valid).toBe(false);
  });

  it('fails closed when token is undefined, empty, or whitespace', async () => {
    expect(await verifyTurnstile(undefined, '127.0.0.1')).toBe(false);
    expect(await verifyTurnstile('', '127.0.0.1')).toBe(false);
    expect(await verifyTurnstile('   ', '127.0.0.1')).toBe(false);
  });
});

describe('5. Blocklist Enforcement', () => {
  it('identifies blocked phone numbers', async () => {
    mockFrom.mockReturnValueOnce({
      select: () => ({
        or: () => ({
          limit: () =>
            Promise.resolve({
              data: [{ id: 1, kind: 'phone', reason: 'Fraudulent order history' }],
              error: null,
            }),
        }),
      }),
    });

    const mockAdmin = { from: mockFrom } as any;
    const result = await isBlocked(mockAdmin, { phone: '+2348011223344' });

    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('Fraudulent order history');
  });

  it('identifies blocked IP hashes', async () => {
    mockFrom.mockReturnValueOnce({
      select: () => ({
        or: () => ({
          limit: () =>
            Promise.resolve({
              data: [{ id: 2, kind: 'ip_hash', reason: 'Scraping / bot abuse' }],
              error: null,
            }),
        }),
      }),
    });

    const mockAdmin = { from: mockFrom } as any;
    const result = await isBlocked(mockAdmin, { ipHash: 'abcd1234efgh5678' });

    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('Scraping / bot abuse');
  });

  it('returns false when neither phone nor IP hash is listed in blocklist', async () => {
    mockFrom.mockReturnValueOnce({
      select: () => ({
        or: () => ({
          limit: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    });

    const mockAdmin = { from: mockFrom } as any;
    const result = await isBlocked(mockAdmin, {
      phone: '+2348099887766',
      ipHash: 'cleaniphash12345',
    });

    expect(result.blocked).toBe(false);
  });

  it('returns false when no phone or ipHash is provided', async () => {
    const mockAdmin = { from: mockFrom } as any;
    const result = await isBlocked(mockAdmin, {});
    expect(result.blocked).toBe(false);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

describe('6. Privilege Escalation & Admin Role Protection', () => {
  const mockUser = { id: 'user-uuid-1', email: 'admin@keraunous.ng' } as any;

  it('allows owner with AAL2 to access owner-protected resources', () => {
    const ownerProfile = {
      userId: 'user-uuid-1',
      role: 'owner' as const,
      displayName: 'Shop Owner',
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    expect(() => verifyOwnerAccess(mockUser, ownerProfile, 'aal2')).not.toThrow();
  });

  it('strictly blocks staff from accessing owner-protected actions (throws FORBIDDEN)', () => {
    const staffProfile = {
      userId: 'user-uuid-1',
      role: 'staff' as const,
      displayName: 'Sales Staff',
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    expect(() => verifyOwnerAccess(mockUser, staffProfile, 'aal2')).toThrow(AppError);
    try {
      verifyOwnerAccess(mockUser, staffProfile, 'aal2');
    } catch (e) {
      const err = e as AppError;
      expect(err.code).toBe('FORBIDDEN');
      expect(err.message.toLowerCase()).toContain('owner role required');
    }
  });

  it('blocks users without AAL2 MFA even if role is owner', () => {
    const ownerProfile = {
      userId: 'user-uuid-1',
      role: 'owner' as const,
      displayName: 'Shop Owner',
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    expect(() => verifyOwnerAccess(mockUser, ownerProfile, 'aal1')).toThrow(AppError);
  });
});

describe('7. Log Redaction & PII Protection', () => {
  it('masks Nigerian phone numbers with +23480****XXXX pattern', () => {
    expect(maskPhone('+2348070822409')).toBe('+23480****2409');
    expect(maskPhone('08031234567')).toBe('+23480****4567');
    expect(maskPhone('08180009999')).toBe('+23481****9999');
  });

  it('hashes IP addresses deterministically using SHA-256 (16 char prefix)', () => {
    const ip = '192.168.1.100';
    const hash = hashIp(ip);
    expect(hash).toHaveLength(16);
    expect(hash).toMatch(/^[a-f0-9]{16}$/);
    // Deterministic check
    expect(hashIp(ip)).toBe(hash);
    expect(hashIp('192.168.1.101')).not.toBe(hash);
  });

  it('redacts sensitive fields (tokens, secrets, passwords, addresses) in structured logger', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    logger.info('Order processed', {
      token: 'super-secret-token',
      password: 'mypassword123',
      delivery_address: '15 Allen Avenue, Ikeja, Lagos',
      customerPhone: '+2348070822409',
      orderId: 'KRN-261013-ABC78',
    });

    expect(consoleSpy).toHaveBeenCalled();
    const loggedOutput = consoleSpy.mock.calls[0][0];
    const parsed = JSON.parse(loggedOutput);

    expect(parsed.token).toBe('[REDACTED]');
    expect(parsed.password).toBe('[REDACTED]');
    expect(parsed.delivery_address).toBe('[REDACTED]');
    expect(parsed.customerPhone).toBe('+23480****2409');
    expect(parsed.orderId).toBe('KRN-261013-ABC78');

    consoleSpy.mockRestore();
  });
});

describe('8. Owner Security Alerts Recording', () => {
  it('inserts security alert into owner_alerts table with proper metadata', async () => {
    mockFrom.mockReturnValueOnce({
      insert: mockInsert.mockResolvedValueOnce({ error: null }),
    });

    await recordOwnerAlert({
      type: 'whatsapp_changed',
      severity: 'critical',
      title: 'Business WhatsApp Number Modified',
      message: 'WhatsApp number changed from +2348070822409 to +2348099999999',
      meta: { old: '+2348070822409', new: '+2348099999999' },
    });

    expect(mockFrom).toHaveBeenCalledWith('owner_alerts');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'whatsapp_changed',
        severity: 'critical',
        title: 'Business WhatsApp Number Modified',
      }),
    );
  });
});
