/**
 * Supabase Admin Client
 * Uses the Service Role key to bypass RLS for internal RPCs and administrative routines.
 * Strictly guarded with `import 'server-only'`.
 */
import 'server-only';

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
