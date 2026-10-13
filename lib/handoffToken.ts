/**
 * Handoff Token Utility (U10)
 * Signs and verifies order handoff tokens for WhatsApp redirection tracking.
 * Uses HMAC-SHA256 with timestamp and constant-time signature verification.
 * Blueprint §8.3, §10.3
 */
import crypto from 'crypto';

const DEFAULT_SECRET = process.env.HANDOFF_TOKEN_SECRET || 'keraunous-handoff-secret-fallback-key-32';
const TOKEN_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

interface HandoffPayload {
  publicId: string;
  orderId: string;
  ts: number;
}

export function signHandoffToken(
  publicId: string,
  orderId: string,
  secretKey: string = DEFAULT_SECRET,
): string {
  const payload: HandoffPayload = {
    publicId,
    orderId,
    ts: Date.now(),
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

export function verifyHandoffToken(
  token: string,
  secretKey: string = DEFAULT_SECRET,
): { valid: boolean; publicId?: string; orderId?: string } {
  if (!token || typeof token !== 'string') {
    return { valid: false };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false };
  }

  const [payloadB64, signature] = parts;
  if (!payloadB64 || !signature) {
    return { valid: false };
  }

  const expectedSig = crypto
    .createHmac('sha256', secretKey)
    .update(payloadB64)
    .digest('base64url');

  try {
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSig);

    if (
      sigBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      return { valid: false };
    }

    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload: HandoffPayload = JSON.parse(payloadJson);

    if (Date.now() - payload.ts > TOKEN_TTL_MS) {
      return { valid: false };
    }

    return {
      valid: true,
      publicId: payload.publicId,
      orderId: payload.orderId,
    };
  } catch {
    return { valid: false };
  }
}
