/**
 * WhatsApp Handoff Tracking Endpoint (U10)
 * POST /api/orders/handoff
 *
 * Blueprint §8.2, §10.3:
 * - Rate limiting: 20 requests/hour per IP
 * - Verifies signed handoffToken
 * - Records whatsapp_opened_at timestamp once
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkPolicyRateLimit } from '@/lib/rateLimit';
import { hashIp } from '@/lib/logger';
import { verifyHandoffToken } from '@/lib/handoffToken';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const HandoffRequestSchema = z.object({
  publicId: z.string().min(5),
  token: z.string().min(10),
});

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const ipHash = hashIp(ip);

  // Rate limit: 10 per hour per IP (Blueprint §10.3)
  const rateResult = checkPolicyRateLimit('handoff', ipHash);
  if (!rateResult.allowed) {
    return NextResponse.json(
      { ok: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: 'INVALID_INPUT', message: 'Malformed JSON payload' } },
      { status: 400 },
    );
  }

  const parsed = HandoffRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: 'VALIDATION_FAILED', message: 'Invalid handoff parameters' } },
      { status: 400 },
    );
  }

  const { publicId, token } = parsed.data;

  // Verify HMAC signature and token expiration
  const tokenResult = verifyHandoffToken(token);
  if (!tokenResult.valid || tokenResult.publicId !== publicId) {
    return NextResponse.json(
      { ok: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired handoff token' } },
      { status: 403 },
    );
  }

  const supabaseAdmin = createAdminClient();

  // Set whatsapp_opened_at if not already recorded
  const { error } = await supabaseAdmin
    .from('orders')
    .update({ whatsapp_opened_at: new Date().toISOString() })
    .eq('public_id', publicId)
    .is('whatsapp_opened_at', null);

  if (error) {
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL', message: 'Could not record handoff' } },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    data: { marked: true },
  });
}
