/**
 * Order List Resolver API Endpoint (U09)
 * POST /api/list/resolve
 *
 * Rate limited to 60/min/IP.
 * Never cached (Cache-Control: no-store).
 * Resolves raw { variantId, qty } items into fresh server-verified prices,
 * product details, availability, and stock limits.
 * Blueprint §8.2, §9.5, §15.8
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rateLimit';
import {
  ResolveListRequestSchema,
  type ResolvedLine,
  ORDER_LIST_MAX_QTY,
} from '@/lib/contracts/list';

export const dynamic = 'force-dynamic';

function formatCondition(condition?: string | null): string | null {
  if (!condition) return null;
  if (condition === 'brand_new') return 'Brand New';
  if (condition === 'uk_used') return 'UK Used';
  if (condition === 'open_box') return 'Open Box';
  return condition;
}

export async function POST(request: NextRequest) {
  // Rate limiting: 60/min per IP
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rateLimitResult = checkRateLimit(`list-resolve:${ip}`, 60, 60 * 1000);
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

  const parsed = ResolveListRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message || 'Invalid list request',
        },
      },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const { items } = parsed.data;
  const variantIds = items.map((i) => i.variantId);

  const supabase = await createClient();

  // 1. Fetch public variants (applies active sales and pricing logic)
  const { data: variants, error: variantsError } = await supabase
    .from('v_product_variants_public')
    .select('*')
    .in('id', variantIds);

  if (variantsError) {
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL', message: 'Failed to resolve variant pricing' } },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const variantMap = new Map((variants ?? []).map((v) => [v.id, v]));
  const productIds = Array.from(
    new Set((variants ?? []).map((v) => v.product_id)),
  );

  // 2. Fetch published products matching variants
  let productMap = new Map<string, { slug: string; name: string; primary_image: string | null }>();
  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from('v_product_cards')
      .select('id, slug, name, primary_image')
      .in('id', productIds);

    if (products) {
      productMap = new Map(products.map((p) => [p.id, p]));
    }
  }

  // 3. Assemble resolved lines
  const lines: ResolvedLine[] = [];
  let subtotalNgn = 0;

  for (const item of items) {
    const variant = variantMap.get(item.variantId);
    if (!variant) {
      lines.push({
        variantId: item.variantId,
        productSlug: '',
        name: 'Item no longer available',
        label: 'Unavailable',
        imageUrl: null,
        unitPriceNgn: 0,
        qty: item.qty,
        available: false,
        maxQty: 0,
      });
      continue;
    }

    const product = productMap.get(variant.product_id);
    if (!product) {
      // Product unpublished or archived
      lines.push({
        variantId: item.variantId,
        productSlug: '',
        name: 'Item no longer available',
        label: 'Unavailable',
        imageUrl: null,
        unitPriceNgn: 0,
        qty: item.qty,
        available: false,
        maxQty: 0,
      });
      continue;
    }

    const parts = [
      variant.storage_gb ? `${variant.storage_gb}GB` : null,
      variant.color ?? null,
      formatCondition(variant.condition),
    ].filter(Boolean);
    const label = parts.length > 0 ? parts.join(' · ') : 'Standard';

    const isAvailable = variant.stock_qty > 0;
    const maxQty = Math.min(ORDER_LIST_MAX_QTY, Math.max(0, variant.stock_qty));
    const effectiveQty = isAvailable ? Math.min(item.qty, Math.max(1, maxQty)) : item.qty;
    const unitPriceNgn = variant.current_price_ngn;

    if (isAvailable) {
      subtotalNgn += unitPriceNgn * effectiveQty;
    }

    lines.push({
      variantId: item.variantId,
      productSlug: product.slug,
      name: product.name,
      label,
      imageUrl: product.primary_image,
      unitPriceNgn,
      qty: effectiveQty,
      available: isAvailable,
      maxQty,
    });
  }

  return NextResponse.json(
    {
      ok: true,
      data: {
        lines,
        subtotalNgn,
      },
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    },
  );
}
