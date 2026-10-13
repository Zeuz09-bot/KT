/**
 * Order Creation Route (U10)
 * POST /api/orders
 *
 * Implements Blueprint §8.3:
 * - Rate limiting: 5 orders/hour per IP, max 5 open NEW orders per phone
 * - Turnstile captcha validation
 * - Server-only execution via createAdminClient()
 * - create_order RPC invocation with tamper protection
 * - WhatsApp URL and message synthesis with signed handoffToken
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkPolicyRateLimit } from '@/lib/rateLimit';
import { verifyTurnstile } from '@/lib/turnstile';
import { isBlocked } from '@/modules/security/blocklist';
import { hashIp } from '@/lib/logger';
import { signHandoffToken } from '@/lib/handoffToken';
import {
  CreateOrderRequestSchema,
  type CreateOrderResponseData,
} from '@/lib/contracts/orders';
import {
  buildOrderMessage,
  buildWaUrl,
  buildWaWebUrl,
} from '@/modules/whatsapp';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const ipHash = hashIp(ip);

  // 1. Rate limiting: 5 orders per hour per IP (Blueprint §8.3, §10.3)
  const rateResult = checkPolicyRateLimit('orders', ipHash);
  if (!rateResult.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many order attempts from this connection. Please try again later or contact us on WhatsApp.',
        },
      },
      { status: 429 },
    );
  }

  // 2. Parse request payload
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: 'INVALID_INPUT', message: 'Malformed JSON payload' } },
      { status: 400 },
    );
  }

  const parseResult = CreateOrderRequestSchema.safeParse(body);
  if (!parseResult.success) {
    const firstIssue = parseResult.error.issues[0];
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: firstIssue ? `${firstIssue.path.join('.')}: ${firstIssue.message}` : 'Validation error',
          details: parseResult.error.format(),
        },
      },
      { status: 400 },
    );
  }

  const orderInput = parseResult.data;

  // 3. Turnstile verification (fail-closed in production)
  const captchaValid = await verifyTurnstile(orderInput.turnstileToken, ip);
  if (!captchaValid) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'CAPTCHA_FAILED',
          message: 'Security verification failed. Please try submitting again.',
        },
      },
      { status: 400 },
    );
  }

  const supabaseAdmin = createAdminClient();

  // 4. Blocklist enforcement (§7.2, §10.3 U15)
  const blockCheck = await isBlocked(supabaseAdmin, {
    phone: orderInput.customer.phone,
    ipHash,
  });
  if (blockCheck.blocked) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'BLOCKED',
          message: 'Unable to process order. Please contact customer support on WhatsApp.',
        },
      },
      { status: 403 },
    );
  }

  // 5. Phone limit: max 5 open NEW orders per phone
  const { count: openOrdersCount } = await supabaseAdmin
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('customer_phone', orderInput.customer.phone)
    .eq('status', 'new');

  if (openOrdersCount && openOrdersCount >= 5) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'TOO_MANY_OPEN_ORDERS',
          message: 'You have 5 open pending orders. Please complete or discuss them on WhatsApp before placing new orders.',
        },
      },
      { status: 429 },
    );
  }

  // 5. Call create_order RPC
  const rpcPayload = {
    idempotency_key: orderInput.idempotencyKey,
    customer_name: orderInput.customer.name,
    customer_phone: orderInput.customer.phone,
    fulfilment: orderInput.fulfilment,
    delivery_state: orderInput.delivery?.state ?? null,
    delivery_city: orderInput.delivery?.city ?? null,
    delivery_address: orderInput.delivery?.address ?? null,
    customer_note: orderInput.note ?? null,
    expected_total: orderInput.expectedTotalNgn,
    items: orderInput.items.map((i) => ({
      variant_id: i.variantId,
      qty: i.qty,
      expected_unit_price: i.expectedUnitPriceNgn,
    })),
    utm: orderInput.utm ?? null,
    ip_hash: ipHash,
  };

  interface CreateOrderRpcSuccess {
    ok: true;
    data: {
      order_id: string;
      public_id: string;
      status: string;
      total_ngn: number;
    };
  }

  interface CreateOrderRpcError {
    ok: false;
    error: {
      code?: string;
      message?: string;
      details?: unknown;
    };
  }

  type CreateOrderRpcResult = CreateOrderRpcSuccess | CreateOrderRpcError;

  const { data: rpcRes, error: rpcError } = await supabaseAdmin.rpc('create_order', {
    payload: rpcPayload as unknown as Record<string, unknown>,
  });

  if (rpcError) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'INTERNAL',
          message: 'Order creation could not be completed at this time',
        },
      },
      { status: 500 },
    );
  }

  const rpcData = rpcRes as unknown as CreateOrderRpcResult;
  if (!rpcData || !rpcData.ok) {
    const err = rpcData?.error || {};
    let status = 400;
    if (err.code === 'PRICE_CHANGED' || err.code === 'OUT_OF_STOCK' || err.code === 'ITEM_UNAVAILABLE') {
      status = 409;
    } else if (err.code === 'ORDERS_DISABLED') {
      status = 503;
    }

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: err.code || 'ORDER_FAILED',
          message: err.message || 'Order could not be placed',
          details: err.details,
        },
      },
      { status },
    );
  }

  const orderId: string = rpcData.data.order_id;
  const publicId: string = rpcData.data.public_id;
  const totalNgn: number = rpcData.data.total_ngn;

  // 6. Fetch snapshot items from order_items
  const { data: dbItems } = await supabaseAdmin
    .from('order_items')
    .select('product_name, variant_label, qty, unit_price_ngn')
    .eq('order_id', orderId);

  // 7. Fetch business WhatsApp phone from site_settings
  const { data: waSetting } = await supabaseAdmin
    .from('site_settings')
    .select('value')
    .eq('key', 'whatsapp_number')
    .maybeSingle();

  let businessPhone = '+2348070822409';
  if (waSetting?.value && typeof waSetting.value === 'object') {
    const val = waSetting.value as Record<string, unknown>;
    if (typeof val.phone === 'string') {
      businessPhone = val.phone;
    } else if (typeof val.value === 'string') {
      businessPhone = val.value;
    } else if (typeof val.whatsapp_number === 'string') {
      businessPhone = val.whatsapp_number;
    }
  }

  // 8. Build WhatsApp message and URLs
  const itemsSnapshot = (dbItems ?? []).map((i) => ({
    productName: i.product_name,
    variantLabel: i.variant_label,
    qty: i.qty,
    unitPriceNgn: i.unit_price_ngn,
  }));

  const messageText = buildOrderMessage({
    publicId,
    customerName: orderInput.customer.name,
    customerPhone: orderInput.customer.phone,
    fulfilment: orderInput.fulfilment,
    deliveryState: orderInput.delivery?.state,
    deliveryCity: orderInput.delivery?.city,
    deliveryAddress: orderInput.delivery?.address,
    customerNote: orderInput.note,
    items: itemsSnapshot,
    totalNgn,
  });

  const whatsappUrl = buildWaUrl(businessPhone, messageText);
  const waWebUrl = buildWaWebUrl(businessPhone, messageText);
  const handoffToken = signHandoffToken(publicId, orderId);

  const responseData: CreateOrderResponseData = {
    publicId,
    orderId,
    createdAt: new Date().toISOString(),
    items: itemsSnapshot.map((i) => ({
      name: i.productName,
      label: i.variantLabel,
      qty: i.qty,
      unitPriceNgn: i.unitPriceNgn,
    })),
    subtotalNgn: totalNgn,
    totalNgn,
    whatsappUrl,
    waWebUrl,
    messageText,
    handoffToken,
  };

  return NextResponse.json(
    {
      ok: true,
      data: responseData,
    },
    { status: 201 },
  );
}
