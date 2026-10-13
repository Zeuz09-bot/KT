/**
 * Keraunous Tech Store — Notification Types
 *
 * Implements Blueprint §10.3 (U16) & master prompt:
 * - Event schemas for seller alerts
 * - Strict privacy rules: NEVER includes customer phone number or street address
 */

export interface NewOrderNotificationPayload {
  orderId: string; // e.g. KRN-261013-ABC78
  itemCount: number;
  totalNgn: number;
  fulfilmentState: string; // e.g. "Lagos", "Ondo", or "Pickup"
  itemsSummary?: string; // e.g. "iPhone 15 Pro Max (x1)"
}

export interface UncontactedOrdersNotificationPayload {
  count: number;
  orders: Array<{
    orderId: string;
    createdAt: string;
    totalNgn: number;
  }>;
}

export interface LowStockNotificationPayload {
  items: Array<{
    productName: string;
    variantLabel: string;
    stockQty: number;
  }>;
}

export interface OwnerAlertNotificationPayload {
  alertId?: number;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
}

export interface DailySummaryNotificationPayload {
  date: string;
  totalOrdersToday: number;
  totalRevenueNgn: number;
  deliveredOrders: number;
  pendingHolds: number;
  lowStockItemsCount: number;
}

export type NotificationEvent =
  | { type: 'new_order'; data: NewOrderNotificationPayload }
  | { type: 'uncontacted_orders'; data: UncontactedOrdersNotificationPayload }
  | { type: 'low_stock'; data: LowStockNotificationPayload }
  | { type: 'owner_alert'; data: OwnerAlertNotificationPayload }
  | { type: 'daily_summary'; data: DailySummaryNotificationPayload };

export interface NotificationResult {
  success: boolean;
  channel: 'telegram' | 'log' | 'noop';
  messageId?: string | number;
  error?: string;
}
