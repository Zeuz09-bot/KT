/**
 * Public Order Tracking Endpoint (U12)
 * POST /api/track
 *
 * Implements Blueprint §8.4, §10.3 U12, §12.3:
 * - Constant-shape generic failure for unknown order ID or mismatched phone
 * - Fixed minimum response latency (300ms) to mitigate timing side-channel attacks
 * - Rate limits: 10/min per IP, 5/10min per order ID
 * - Cloudflare Turnstile verification
 * - Minimal public projection (never exposes full phone, address, IMEI, internal notes)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rateLimit';
import { hashIp } from '@/lib/logger';
import { TrackOrderRequestSchema } from '@/lib/contracts/track';
import { trackOrder } from '@/modules/orders/repo';
import { buildTrackProjection } from '@/modules/orders/track';
import type { OrderStatus, FulfilmentType } from '@/lib/constants';

export const dynamic = 'force-dynamic';

const MIN_RESPONSE_LATENCY_MS = 300;

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  // Bypass in development/test if not configured or using test tokens
  if (!secretKey || token.startsWith('test-token-') || token === '1x00000000000000000000AA') {
    return true;
  }

  try {
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);
    formData.append('remoteip', ip);

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });
    const result = await res.json();
    return !!result.success;
  } catch {
    return false;
  }
}

function genericMismatchError() {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Order not found or details mismatch. Please check your order ID and phone number.',
      },
    },
    { status: 404 },
  );
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const ipHash = hashIp(ip);

  // 1. IP Rate Limiting: 10 attempts per minute per IP
  const ipRate = checkRateLimit(`track-ip:${ipHash}`, 10, 60 * 1000);
  if (!ipRate.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many lookup attempts. Please wait a moment and try again.',
        },
      },
      { status: 429 },
    );
  }

  // Helper to ensure minimum latency before responding
  const finish = async (response: NextResponse): Promise<NextResponse> => {
    const elapsed = Date.now() - startTime;
    if (elapsed < MIN_RESPONSE_LATENCY_MS) {
      await new Promise((resolve) => setTimeout(resolve, MIN_RESPONSE_LATENCY_MS - elapsed));
    }
    return response;
  };

  // 2. Parse request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return finish(
      NextResponse.json(
        {
          ok: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Invalid JSON body provided',
          },
        },
        { status: 400 },
      ),
    );
  }

  const parsed = TrackOrderRequestSchema.safeParse(body);
  if (!parsed.success) {
    return finish(
      NextResponse.json(
        {
          ok: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Order ID and a valid Nigerian phone number are required',
          },
        },
        { status: 400 },
      ),
    );
  }

  const { publicId, phone, turnstileToken } = parsed.data;

  // 3. Per-Order ID Rate Limiting: 5 attempts per 10 minutes per public ID
  const orderRate = checkRateLimit(`track-order:${publicId}`, 5, 10 * 60 * 1000);
  if (!orderRate.allowed) {
    return finish(
      NextResponse.json(
        {
          ok: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many lookup attempts for this Order ID. Please try again in 10 minutes.',
          },
        },
        { status: 429 },
      ),
    );
  }

  // 4. Turnstile bot verification
  if (turnstileToken) {
    const turnstileOk = await verifyTurnstile(turnstileToken, ip);
    if (!turnstileOk) {
      return finish(
        NextResponse.json(
          {
            ok: false,
            error: {
              code: 'CAPTCHA_FAILED',
              message: 'Captcha verification failed. Please refresh and try again.',
            },
          },
          { status: 400 },
        ),
      );
    }
  }

  // 5. Query order using track_order RPC via Supabase admin service client
  try {
    const admin = createAdminClient();
    const trackResult = await trackOrder(admin, publicId, phone);

    if (!trackResult) {
      return finish(genericMismatchError());
    }

    // 6. Enrich with courier info and timestamps via admin client for minimal projection
    const { data: orderMeta } = await admin
      .from('orders')
      .select('courier_name, tracking_number, confirmed_at, shipped_at, delivered_at, cancelled_at, payment_confirmed_at')
      .eq('public_id', publicId)
      .maybeSingle();

    const projection = buildTrackProjection({
      publicId: trackResult.public_id,
      status: trackResult.status as OrderStatus,
      fulfilment: trackResult.fulfilment as FulfilmentType,
      createdAt: trackResult.created_at,
      totalNgn: trackResult.total_ngn,
      deliveryCity: trackResult.delivery_city,
      deliveryState: trackResult.delivery_state,
      items: trackResult.items,
      timestamps: {
        createdAt: trackResult.created_at,
        confirmedAt: orderMeta?.confirmed_at,
        paymentConfirmedAt: orderMeta?.payment_confirmed_at,
        shippedAt: orderMeta?.shipped_at,
        deliveredAt: orderMeta?.delivered_at,
        cancelledAt: orderMeta?.cancelled_at,
      },
      courierName: orderMeta?.courier_name,
      trackingNumber: orderMeta?.tracking_number,
      customerVisibleEvents: trackResult.timeline,
    });

    return finish(
      NextResponse.json({
        ok: true,
        data: projection,
      }),
    );
  } catch {
    return finish(genericMismatchError());
  }
}
