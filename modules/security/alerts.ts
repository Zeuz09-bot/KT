import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import type { Json } from '@/lib/database.types';

export interface OwnerAlertInput {
  type:
    | 'whatsapp_changed'
    | 'new_staff'
    | 'repeated_failed_logins'
    | 'security_breach'
    | 'system';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  meta?: Record<string, unknown> | null;
}

/**
 * Records an owner security alert in the database for owner review and dispatch (U16).
 * Strictly server-only.
 */
export async function recordOwnerAlert(alert: OwnerAlertInput): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from('owner_alerts').insert({
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      meta: (alert.meta as Json) ?? null,
    });

    if (error) {
      logger.error('Failed to record owner security alert', {
        error: error.message,
        type: alert.type,
        title: alert.title,
      });
      return;
    }

    // Also structured-log for observability
    const logMethod =
      alert.severity === 'critical'
        ? logger.error
        : alert.severity === 'warning'
        ? logger.warn
        : logger.info;

    logMethod(`[OWNER ALERT: ${alert.title}] ${alert.message}`, {
      alertType: alert.type,
      severity: alert.severity,
      ...alert.meta,
    });
  } catch (err) {
    logger.error('Unexpected error recording owner alert', {
      error: err instanceof Error ? err.message : String(err),
      type: alert.type,
    });
  }
}
