import 'server-only';

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type {
  AdminOrderListItem,
  AdminOrderDetail,
  AdminOrderItem,
  AdminOrderEvent,
  DashboardStats,
  OrderFilter,
} from '@/lib/contracts/admin-orders';
import type { OrderStatus, FulfilmentType } from '@/lib/constants';

/**
 * List orders with filtering, search, pagination, and alert badges.
 */
export async function listOrders(
  supabase: SupabaseClient<Database>,
  filters: Partial<OrderFilter> = {},
): Promise<{ orders: AdminOrderListItem[]; total: number }> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('orders')
    .select(
      `
      id,
      public_id,
      customer_name,
      customer_phone,
      status,
      fulfilment,
      total_ngn,
      created_at,
      confirmed_at,
      whatsapp_opened_at,
      order_items ( id )
    `,
      { count: 'exact' },
    );

  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }

  if (filters.fulfilment) {
    query = query.eq('fulfilment', filters.fulfilment);
  }

  if (filters.dateFrom) {
    query = query.gte('created_at', `${filters.dateFrom}T00:00:00.000Z`);
  }

  if (filters.dateTo) {
    query = query.lte('created_at', `${filters.dateTo}T23:59:59.999Z`);
  }

  if (filters.search && filters.search.trim().length > 0) {
    const term = filters.search.trim();
    query = query.or(
      `public_id.ilike.%${term}%,customer_name.ilike.%${term}%,customer_phone.ilike.%${term}%`,
    );
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + pageSize - 1);

  const { data, count, error } = await query;
  if (error) throw error;

  const now = Date.now();
  // 22 hours in ms (hold expiring warning: 24h default - 2h alert buffer)
  const HOLD_EXPIRING_MS = 22 * 60 * 60 * 1000;

  interface OrderListDbRow {
    id: string;
    public_id: string;
    customer_name: string;
    customer_phone: string;
    status: string;
    fulfilment: string;
    total_ngn: number;
    created_at: string;
    confirmed_at: string | null;
    whatsapp_opened_at: string | null;
    order_items: Array<{ id: string }> | null;
  }

  const rows = (data ?? []) as unknown as OrderListDbRow[];
  const orders: AdminOrderListItem[] = rows.map((row) => {
    const confirmedTime = row.confirmed_at ? new Date(row.confirmed_at).getTime() : null;
    const isHoldExpiring =
      row.status === 'confirmed' &&
      confirmedTime !== null &&
      now - confirmedTime >= HOLD_EXPIRING_MS;

    return {
      id: row.id,
      publicId: row.public_id,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      status: row.status as OrderStatus,
      fulfilment: row.fulfilment as FulfilmentType,
      totalNgn: row.total_ngn,
      itemCount: Array.isArray(row.order_items) ? row.order_items.length : 0,
      createdAt: row.created_at,
      confirmedAt: row.confirmed_at,
      whatsappOpenedAt: row.whatsapp_opened_at,
      alerts: {
        notContacted: row.whatsapp_opened_at === null,
        holdExpiring: isHoldExpiring,
        awaitingPayment: row.status === 'confirmed',
        toShip: row.status === 'paid' || row.status === 'processing',
      },
    };
  });

  return {
    orders,
    total: count ?? 0,
  };
}

/**
 * Fetch full order detail with items and chronological timeline events.
 */
export async function getOrderDetail(
  supabase: SupabaseClient<Database>,
  orderIdOrPublicId: string,
): Promise<AdminOrderDetail | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    orderIdOrPublicId,
  );

  let query = supabase.from('orders').select('*');
  if (isUuid) {
    query = query.eq('id', orderIdOrPublicId);
  } else {
    query = query.eq('public_id', orderIdOrPublicId);
  }

  const { data: order, error: orderErr } = await query.maybeSingle();
  if (orderErr) throw orderErr;
  if (!order) return null;

  // Fetch items
  const { data: itemsData, error: itemsErr } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', order.id);
  if (itemsErr) throw itemsErr;

  // Fetch events with actor details if available
  const { data: eventsData, error: eventsErr } = await supabase
    .from('order_events')
    .select('*')
    .eq('order_id', order.id)
    .order('created_at', { ascending: true });
  if (eventsErr) throw eventsErr;

  // Fetch actor display names if there are events with actor_id
  const actorIds = Array.from(
    new Set((eventsData || []).map((e) => e.actor_id).filter((id): id is string => Boolean(id))),
  );
  let actorNameMap = new Map<string, string>();
  if (actorIds.length > 0) {
    const { data: actors } = await supabase
      .from('admin_users')
      .select('user_id, display_name')
      .in('user_id', actorIds);
    if (actors) {
      for (const a of actors) {
        actorNameMap.set(a.user_id, a.display_name);
      }
    }
  }

  const items: AdminOrderItem[] = (itemsData || []).map((i) => ({
    id: i.id,
    variantId: i.variant_id,
    productName: i.product_name,
    variantLabel: i.variant_label,
    sku: i.sku,
    listedPriceNgn: i.listed_price_ngn,
    unitPriceNgn: i.unit_price_ngn,
    qty: i.qty,
    lineTotalNgn: i.line_total_ngn,
    imei: i.imei,
    stockDeducted: i.stock_deducted,
  }));

  const events: AdminOrderEvent[] = (eventsData || []).map((e) => ({
    id: e.id,
    type: e.type,
    fromStatus: e.from_status as OrderStatus | null,
    toStatus: e.to_status as OrderStatus | null,
    actorId: e.actor_id,
    actorName: e.actor_id ? actorNameMap.get(e.actor_id) ?? null : null,
    note: e.note,
    isCustomerVisible: e.is_customer_visible,
    createdAt: e.created_at,
  }));

  return {
    id: order.id,
    publicId: order.public_id,
    idempotencyKey: order.idempotency_key,
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    fulfilment: order.fulfilment as FulfilmentType,
    deliveryState: order.delivery_state,
    deliveryCity: order.delivery_city,
    deliveryAddress: order.delivery_address,
    customerNote: order.customer_note,
    internalNote: order.internal_note,
    status: order.status as OrderStatus,
    subtotalNgn: order.subtotal_ngn,
    deliveryFeeNgn: order.delivery_fee_ngn,
    discountNgn: order.discount_ngn,
    totalNgn: order.total_ngn,
    paymentConfirmedAt: order.payment_confirmed_at,
    paymentAmountNgn: order.payment_amount_ngn,
    paymentReference: order.payment_reference,
    courierName: order.courier_name,
    trackingNumber: order.tracking_number,
    whatsappOpenedAt: order.whatsapp_opened_at,
    createdAt: order.created_at,
    confirmedAt: order.confirmed_at,
    shippedAt: order.shipped_at,
    deliveredAt: order.delivered_at,
    cancelledAt: order.cancelled_at,
    cancelReason: order.cancel_reason,
    items,
    events,
  };
}

/**
 * Fetch aggregated statistics for the admin dashboard.
 */
export async function getDashboardStats(
  supabase: SupabaseClient<Database>,
): Promise<DashboardStats> {
  // Counts by status
  const [
    newRes,
    awaitingPaymentRes,
    paidRes,
    processingRes,
    deliveredWeekRes,
    lowStockRes,
    soldOutRes,
  ] = await Promise.all([
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'confirmed'),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'paid'),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'processing'),
    // Delivered this week (last 7 days)
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'delivered')
      .gte('delivered_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    // Low stock variants (stock_qty <= low_stock_threshold and stock_qty > 0)
    supabase
      .from('product_variants')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .gt('stock_qty', 0)
      .lte('stock_qty', 2),
    // Sold out variants
    supabase
      .from('product_variants')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('stock_qty', 0),
  ]);

  // Expiring holds (confirmed > 22 hours ago without payment)
  const cutoff22h = new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString();
  const { count: expiringHoldsCount } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'confirmed')
    .is('payment_confirmed_at', null)
    .lte('confirmed_at', cutoff22h);

  return {
    newOrders: newRes.count ?? 0,
    awaitingPayment: awaitingPaymentRes.count ?? 0,
    toShip: (paidRes.count ?? 0) + (processingRes.count ?? 0),
    deliveredThisWeek: deliveredWeekRes.count ?? 0,
    expiringHolds: expiringHoldsCount ?? 0,
    lowStockVariants: lowStockRes.count ?? 0,
    soldOutVariants: soldOutRes.count ?? 0,
  };
}

/**
 * Export orders as CSV string for a given date range (owner only).
 */
export async function exportOrdersCsv(
  supabase: SupabaseClient<Database>,
  dateFrom: string,
  dateTo: string,
): Promise<string> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .gte('created_at', `${dateFrom}T00:00:00.000Z`)
    .lte('created_at', `${dateTo}T23:59:59.999Z`)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const headers = [
    'Order ID',
    'Date (UTC)',
    'Customer Name',
    'Customer Phone',
    'Status',
    'Fulfilment',
    'State',
    'City',
    'Address',
    'Subtotal (NGN)',
    'Delivery Fee (NGN)',
    'Discount (NGN)',
    'Total (NGN)',
    'Payment Confirmed At',
    'Payment Ref',
    'Courier',
    'Tracking Number',
    'Cancel Reason',
  ];

  const escapeCsv = (str: string | number | null | undefined): string => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = (data || []).map((o) =>
    [
      escapeCsv(o.public_id),
      escapeCsv(o.created_at),
      escapeCsv(o.customer_name),
      escapeCsv(o.customer_phone),
      escapeCsv(o.status),
      escapeCsv(o.fulfilment),
      escapeCsv(o.delivery_state),
      escapeCsv(o.delivery_city),
      escapeCsv(o.delivery_address),
      o.subtotal_ngn,
      o.delivery_fee_ngn,
      o.discount_ngn,
      o.total_ngn,
      escapeCsv(o.payment_confirmed_at),
      escapeCsv(o.payment_reference),
      escapeCsv(o.courier_name),
      escapeCsv(o.tracking_number),
      escapeCsv(o.cancel_reason),
    ].join(','),
  );

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Add note to an order's timeline via admin service client.
 */
export async function addOrderNote(
  adminSupabase: SupabaseClient<Database>,
  orderId: string,
  note: string,
  actorId: string | null,
  isCustomerVisible: boolean,
): Promise<void> {
  const { error } = await adminSupabase.from('order_events').insert({
    order_id: orderId,
    type: 'note',
    actor_id: actorId,
    note,
    is_customer_visible: isCustomerVisible,
  });

  if (error) throw error;
}
