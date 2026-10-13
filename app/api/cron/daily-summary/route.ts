/**
 * Daily Summary Cron Route (U16)
 * GET /api/cron/daily-summary
 *
 * Implements Blueprint §10.3 (U16) & master prompt:
 * - Protected by CRON_SECRET
 * - Compiles store performance metrics for the day
 * - Dispatches daily summary via notifyAdmin
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { notifyAdmin } from '@/modules/notifications';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

function verifyCronSecret(request: NextRequest): boolean {
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) {
    return true;
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token === expectedSecret) return true;
  }

  const querySecret = request.nextUrl.searchParams.get('secret');
  if (querySecret && querySecret === expectedSecret) return true;

  return false;
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or missing CRON_SECRET' } },
      { status: 401 },
    );
  }

  const supabase = createAdminClient();

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfTodayIso = today.toISOString();

    // 1. Orders placed today
    const { data: todayOrders, error: ordersErr } = await supabase
      .from('orders')
      .select('status, total_ngn, delivered_at')
      .gte('created_at', startOfTodayIso);

    if (ordersErr) {
      throw new Error(`Failed to query daily orders: ${ordersErr.message}`);
    }

    const ordersList = todayOrders ?? [];
    const totalOrdersToday = ordersList.length;
    const totalRevenueNgn = ordersList.reduce((acc, o) => acc + o.total_ngn, 0);
    const deliveredOrders = ordersList.filter((o) => o.status === 'delivered').length;

    // 2. Pending holds awaiting payment
    const { count: pendingHoldsCount } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'confirmed');

    // 3. Low stock variants
    const { count: lowStockCount } = await supabase
      .from('product_variants')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .lte('stock_qty', 2);

    const dateStr = new Date().toLocaleDateString('en-GB', {
      timeZone: 'Africa/Lagos',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    await notifyAdmin({
      type: 'daily_summary',
      data: {
        date: dateStr,
        totalOrdersToday,
        totalRevenueNgn,
        deliveredOrders,
        pendingHolds: pendingHoldsCount ?? 0,
        lowStockItemsCount: lowStockCount ?? 0,
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        date: dateStr,
        totalOrdersToday,
        totalRevenueNgn,
        deliveredOrders,
        summarySent: true,
      },
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.error('Unhandled error in daily summary cron route', { error: errorMsg });
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL', message: errorMsg } },
      { status: 500 },
    );
  }
}
