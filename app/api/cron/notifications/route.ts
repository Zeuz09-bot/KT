/**
 * Scheduled Notifications Cron Route (U16)
 * GET /api/cron/notifications
 *
 * Implements Blueprint §10.3 (U16) & master prompt:
 * - Protected by CRON_SECRET
 * - Checks uncontacted orders (>30m since creation without WhatsApp link opened)
 * - Checks low stock variants (<= 2 units)
 * - Dispatches pending owner alerts from owner_alerts table
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { notifyAdmin } from '@/modules/notifications';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

function verifyCronSecret(request: NextRequest): boolean {
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) {
    // If CRON_SECRET is not configured in local development, allow execution
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
  let uncontactedDispatched = 0;
  let lowStockDispatched = 0;
  let alertsDispatched = 0;

  try {
    // 1. Check uncontacted orders created > 30 minutes ago
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: uncontactedOrders, error: uncontactedErr } = await supabase
      .from('orders')
      .select('public_id, created_at, total_ngn')
      .eq('status', 'new')
      .is('whatsapp_opened_at', null)
      .lt('created_at', thirtyMinutesAgo)
      .limit(20);

    if (uncontactedErr) {
      logger.error('Failed to query uncontacted orders', { error: uncontactedErr.message });
    } else if (uncontactedOrders && uncontactedOrders.length > 0) {
      await notifyAdmin({
        type: 'uncontacted_orders',
        data: {
          count: uncontactedOrders.length,
          orders: uncontactedOrders.map((o) => ({
            orderId: o.public_id,
            createdAt: o.created_at,
            totalNgn: o.total_ngn,
          })),
        },
      });
      uncontactedDispatched = uncontactedOrders.length;
    }

    // 2. Check low stock active variants (stock <= 2)
    const { data: lowStockRows, error: lowStockErr } = await supabase
      .from('product_variants')
      .select('sku, stock_qty, color, condition, storage_gb, ram_gb, products(name)')
      .eq('is_active', true)
      .lte('stock_qty', 2)
      .order('stock_qty', { ascending: true })
      .limit(15);

    if (lowStockErr) {
      logger.error('Failed to query low stock variants', { error: lowStockErr.message });
    } else if (lowStockRows && lowStockRows.length > 0) {
      const items = lowStockRows.map((r) => {
        const productObj = r.products as unknown as { name?: string };
        const prodName = productObj?.name ?? 'Unknown Product';
        const parts: string[] = [];
        if (r.storage_gb) parts.push(`${r.storage_gb}GB`);
        if (r.color) parts.push(r.color);
        if (r.condition) parts.push(r.condition.replace('_', ' '));
        const label = parts.length > 0 ? parts.join(' · ') : r.sku;

        return {
          productName: prodName,
          variantLabel: label,
          stockQty: r.stock_qty,
        };
      });

      await notifyAdmin({
        type: 'low_stock',
        data: { items },
      });
      lowStockDispatched = items.length;
    }

    // 3. Dispatch pending owner alerts from owner_alerts table
    const { data: pendingAlerts, error: alertsErr } = await supabase
      .from('owner_alerts')
      .select('id, type, severity, title, message')
      .is('read_at', null)
      .order('created_at', { ascending: true })
      .limit(10);

    if (alertsErr) {
      logger.error('Failed to query pending owner alerts', { error: alertsErr.message });
    } else if (pendingAlerts && pendingAlerts.length > 0) {
      for (const alert of pendingAlerts) {
        await notifyAdmin({
          type: 'owner_alert',
          data: {
            alertId: alert.id,
            type: alert.type,
            severity: alert.severity as 'info' | 'warning' | 'critical',
            title: alert.title,
            message: alert.message,
          },
        });

        // Mark alert as delivered
        await supabase
          .from('owner_alerts')
          .update({ read_at: new Date().toISOString() })
          .eq('id', alert.id);

        alertsDispatched++;
      }
    }

    return NextResponse.json({
      ok: true,
      data: {
        timestamp: new Date().toISOString(),
        uncontactedDispatched,
        lowStockDispatched,
        alertsDispatched,
      },
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.error('Unhandled error in cron notifications route', { error: errorMsg });
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL', message: errorMsg } },
      { status: 500 },
    );
  }
}
