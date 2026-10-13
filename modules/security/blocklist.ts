import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { logger } from '@/lib/logger';

export interface BlocklistCheckInput {
  phone?: string | null;
  ipHash?: string | null;
}

export interface BlocklistCheckResult {
  blocked: boolean;
  reason?: string;
}

/**
 * Checks if a given phone number or IP hash is listed in the blocklist table.
 * Strictly uses the admin client with RLS bypass so order creation can verify.
 */
export async function isBlocked(
  adminClient: SupabaseClient<Database>,
  input: BlocklistCheckInput,
): Promise<BlocklistCheckResult> {
  const { phone, ipHash } = input;

  if (!phone && !ipHash) {
    return { blocked: false };
  }

  try {
    const filters: string[] = [];
    if (phone) {
      filters.push(`and(kind.eq.phone,value.eq.${phone})`);
    }
    if (ipHash) {
      filters.push(`and(kind.eq.ip_hash,value.eq.${ipHash})`);
    }

    const { data, error } = await adminClient
      .from('blocklist')
      .select('id, kind, reason')
      .or(filters.join(','))
      .limit(1);

    if (error) {
      logger.error('Failed to query blocklist table', { error: error.message });
      // In case of database read error, do not block legitimate orders
      return { blocked: false };
    }

    if (data && data.length > 0) {
      return {
        blocked: true,
        reason: data[0].reason ?? 'Restricted by administrator',
      };
    }

    return { blocked: false };
  } catch (err) {
    logger.error('Unexpected error checking blocklist', {
      error: err instanceof Error ? err.message : String(err),
    });
    return { blocked: false };
  }
}

/**
 * Adds a new entry to the blocklist.
 */
export async function addToBlocklist(
  adminClient: SupabaseClient<Database>,
  entry: {
    kind: 'phone' | 'ip_hash';
    value: string;
    reason?: string;
    actorId?: string;
  },
): Promise<{ success: boolean; error?: string }> {
  const { error } = await adminClient.from('blocklist').upsert(
    {
      kind: entry.kind,
      value: entry.value,
      reason: entry.reason ?? null,
      created_by: entry.actorId ?? null,
    },
    { onConflict: 'kind,value' },
  );

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Removes an entry from the blocklist by ID.
 */
export async function removeFromBlocklist(
  adminClient: SupabaseClient<Database>,
  id: number,
): Promise<{ success: boolean; error?: string }> {
  const { error } = await adminClient
    .from('blocklist')
    .delete()
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
