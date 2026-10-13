/**
 * Wishlist Resolver API Endpoint (U09)
 * POST /api/wishlist/resolve
 *
 * Rate limited to 60/min/IP.
 * Resolves saved product IDs into published product cards.
 * Blueprint §4, §9.5
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rateLimit';
import {
  ResolveWishlistRequestSchema,
} from '@/lib/contracts/list';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Rate limiting: 60/min per IP
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rateLimitResult = checkRateLimit(`wishlist-resolve:${ip}`, 60, 60 * 1000);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { ok: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
      { status: 429, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON payload' } },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const parsed = ResolveWishlistRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message || 'Invalid wishlist request',
        },
      },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const { productIds } = parsed.data;

  const supabase = await createClient();

  const { data: products, error } = await supabase
    .from('v_product_cards')
    .select('*')
    .in('id', productIds);

  if (error) {
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL', message: 'Failed to resolve wishlist' } },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      data: {
        products: products ?? [],
      },
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    },
  );
}
