import 'server-only';

import { logger } from '@/lib/logger';
import { sendTelegramMessage } from './telegram';
import {
  formatNewOrderMessage,
  formatUncontactedOrdersMessage,
  formatLowStockMessage,
  formatOwnerAlertMessage,
  formatDailySummaryMessage,
} from './formatters';
import type { NotificationEvent, NotificationResult } from './types';

/**
 * Formats and dispatches a notification event to admin channels.
 * Safe execution: catches internal exceptions and returns a failure result.
 */
export async function notifyAdmin(
  event: NotificationEvent,
): Promise<NotificationResult> {
  try {
    let htmlMessage = '';

    switch (event.type) {
      case 'new_order':
        htmlMessage = formatNewOrderMessage(event.data);
        break;
      case 'uncontacted_orders':
        htmlMessage = formatUncontactedOrdersMessage(event.data);
        break;
      case 'low_stock':
        htmlMessage = formatLowStockMessage(event.data);
        break;
      case 'owner_alert':
        htmlMessage = formatOwnerAlertMessage(event.data);
        break;
      case 'daily_summary':
        htmlMessage = formatDailySummaryMessage(event.data);
        break;
      default:
        logger.warn('Unknown notification event type', { event });
        return { success: false, channel: 'noop', error: 'Unknown event type' };
    }

    return await sendTelegramMessage(htmlMessage);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.error('Unexpected error dispatching notification', { error: errorMsg });
    return {
      success: false,
      channel: 'noop',
      error: errorMsg,
    };
  }
}

/**
 * Non-blocking fire-and-forget notification dispatcher.
 * Used inside request paths (such as order creation) so that notifications
 * never block the response or fail the customer interaction.
 */
export function notifyAdminAsync(event: NotificationEvent): void {
  // Execute in microtask / background
  Promise.resolve()
    .then(() => notifyAdmin(event))
    .catch((err) => {
      logger.error('Unhandled background notification rejection', {
        error: err instanceof Error ? err.message : String(err),
      });
    });
}
