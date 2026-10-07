import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import type { Json } from '@/lib/database.types';

export interface AuditLogEntry {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  before?: Json | null;
  after?: Json | null;
  ipHash?: string | null;
}

/**
 * Writes an immutable audit entry to the audit_log table using the admin client.
 */
export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from('audit_log').insert({
      actor_id: entry.actorId ?? null,
      action: entry.action,
      entity: entry.entity,
      entity_id: entry.entityId ?? null,
      before: (entry.before as Json) ?? null,
      after: (entry.after as Json) ?? null,
      ip_hash: entry.ipHash ?? null,
    });

    if (error) {
      logger.error('Failed to write audit log', {
        error: error.message,
        action: entry.action,
        entity: entry.entity,
      });
    }
  } catch (err) {
    logger.error('Unexpected error writing audit log', {
      error: err instanceof Error ? err.message : String(err),
      action: entry.action,
    });
  }
}
