/**
 * U10 — Handoff Token Signing & Verification Tests
 * Blueprint §8.3, §10.3
 */
import { describe, it, expect } from 'vitest';
import {
  signHandoffToken,
  verifyHandoffToken,
} from '../../lib/handoffToken';

describe('handoffToken', () => {
  const secret = 'super-secret-test-key-32-bytes-long!';
  const publicId = 'KRN-261013-ABC78';
  const orderId = '550e8400-e29b-41d4-a716-446655440000';

  it('signs and verifies a valid handoff token', () => {
    const token = signHandoffToken(publicId, orderId, secret);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);

    const result = verifyHandoffToken(token, secret);
    expect(result.valid).toBe(true);
    expect(result.publicId).toBe(publicId);
    expect(result.orderId).toBe(orderId);
  });

  it('rejects a token signed with a different secret', () => {
    const token = signHandoffToken(publicId, orderId, secret);
    const result = verifyHandoffToken(token, 'different-secret-key-1234567890!');
    expect(result.valid).toBe(false);
  });

  it('rejects a tampered token payload', () => {
    const token = signHandoffToken(publicId, orderId, secret);
    const parts = token.split('.');
    // Tamper payload part
    const tampered = `${parts[0]}.tampered.${parts[2]}`;
    const result = verifyHandoffToken(tampered, secret);
    expect(result.valid).toBe(false);
  });

  it('rejects empty or malformed token strings', () => {
    expect(verifyHandoffToken('', secret).valid).toBe(false);
    expect(verifyHandoffToken('not-a-token', secret).valid).toBe(false);
    expect(verifyHandoffToken('a.b', secret).valid).toBe(false);
  });
});
