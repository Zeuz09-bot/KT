/**
 * Search API Endpoint
 * Returns up to 8 product suggestions based on search query.
 * Blueprint §9.7 — debounced 250 ms, edge-cached 60 s, rate limited 30/min.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = (searchParams.get('q') || '').trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ ok: true, data: [] });
  }

  // Rate limit: 30/min per IP
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rateLimitResult = checkRateLimit(`search:${ip}`, 30, 60 * 1000);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { ok: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
      { status: 429 },
    );
  }

  const supabase = await createClient();

  // Normalise: lowercase, collapse whitespace
  const normalised = query.toLowerCase().replace(/\s+/g, ' ');

  const { data, error } = await supabase
    .from('v_product_cards')
    .select('id, slug, name, brand_name, primary_image, price_from_ngn')
    .ilike('name', `%${normalised}%`)
    .eq('status', 'published')
    .limit(8);

  if (error) {
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL', message: 'Search failed' } },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { ok: true, data: data ?? [] },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    },
  );
}
