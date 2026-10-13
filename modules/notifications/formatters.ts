import { formatNgn } from '@/lib/money';
import type {
  NewOrderNotificationPayload,
  UncontactedOrdersNotificationPayload,
  LowStockNotificationPayload,
  OwnerAlertNotificationPayload,
  DailySummaryNotificationPayload,
} from './types';

/**
 * Escapes characters for Telegram HTML parse mode.
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Formats a new order notification.
 * STRICT PRIVACY: NEVER contains customer phone number or street address!
 */
export function formatNewOrderMessage(payload: NewOrderNotificationPayload): string {
  const lines = [
    '🛍️ <b>New Order Placed</b>',
    '',
    `<b>Order ID:</b> <code>${escapeHtml(payload.orderId)}</code>`,
    `<b>Items:</b> ${payload.itemCount} item(s)${
      payload.itemsSummary ? ` · ${escapeHtml(payload.itemsSummary)}` : ''
    }`,
    `<b>Total:</b> ${formatNgn(payload.totalNgn)}`,
    `<b>Fulfilment:</b> ${escapeHtml(payload.fulfilmentState)}`,
    '',
    '<i>Customer is being directed to WhatsApp for confirmation.</i>',
  ];

  return lines.join('\n');
}

/**
 * Formats uncontacted orders (> 30 min since creation without WhatsApp handoff).
 */
export function formatUncontactedOrdersMessage(
  payload: UncontactedOrdersNotificationPayload,
): string {
  const lines = [
    '⚠️ <b>Orders Pending WhatsApp Contact (>30m)</b>',
    '',
    `<b>Count:</b> ${payload.count} uncontacted order(s)`,
    '',
  ];

  payload.orders.slice(0, 10).forEach((ord) => {
    lines.push(
      `• <code>${escapeHtml(ord.orderId)}</code> — ${formatNgn(ord.totalNgn)}`,
    );
  });

  if (payload.orders.length > 10) {
    lines.push(`<i>...and ${payload.orders.length - 10} more.</i>`);
  }

  lines.push('', '<i>Consider checking admin desk to message these customers.</i>');
  return lines.join('\n');
}

/**
 * Formats low stock alerts.
 */
export function formatLowStockMessage(payload: LowStockNotificationPayload): string {
  const lines = ['📉 <b>Low Stock Alert</b>', ''];

  payload.items.slice(0, 15).forEach((item) => {
    const badge = item.stockQty === 0 ? '❌ <b>SOLD OUT</b>' : `⚠️ <b>${item.stockQty} left</b>`;
    lines.push(
      `• ${escapeHtml(item.productName)} (${escapeHtml(item.variantLabel)}) — ${badge}`,
    );
  });

  if (payload.items.length > 15) {
    lines.push(`<i>...and ${payload.items.length - 15} more.</i>`);
  }

  return lines.join('\n');
}

/**
 * Formats owner security alerts (e.g. WhatsApp number changed, repeated failed logins).
 */
export function formatOwnerAlertMessage(payload: OwnerAlertNotificationPayload): string {
  const emoji =
    payload.severity === 'critical'
      ? '🚨'
      : payload.severity === 'warning'
      ? '⚠️'
      : 'ℹ️';

  const lines = [
    `${emoji} <b>Owner Security Alert: ${escapeHtml(payload.title)}</b>`,
    '',
    `<b>Severity:</b> ${payload.severity.toUpperCase()}`,
    `<b>Type:</b> <code>${escapeHtml(payload.type)}</code>`,
    `<b>Details:</b> ${escapeHtml(payload.message)}`,
  ];

  return lines.join('\n');
}

/**
 * Formats the evening daily store summary.
 */
export function formatDailySummaryMessage(
  payload: DailySummaryNotificationPayload,
): string {
  const lines = [
    `📊 <b>Daily Store Summary — ${escapeHtml(payload.date)}</b>`,
    '',
    `<b>New Orders Today:</b> ${payload.totalOrdersToday}`,
    `<b>Total Revenue:</b> ${formatNgn(payload.totalRevenueNgn)}`,
    `<b>Orders Delivered Today:</b> ${payload.deliveredOrders}`,
    `<b>Holds Awaiting Payment:</b> ${payload.pendingHolds}`,
    `<b>Low Stock Variants:</b> ${payload.lowStockItemsCount}`,
  ];

  return lines.join('\n');
}
