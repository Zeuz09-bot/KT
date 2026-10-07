/**
 * Admin Authentication Data Repository
 * Queries admin_users roles and active status.
 */
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database, AdminRole } from '@/lib/database.types';

export interface AdminUserProfile {
  userId: string;
  role: AdminRole;
  displayName: string;
  isActive: boolean;
  createdAt: string;
}

export async function getAdminUserProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<AdminUserProfile | null> {
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;

  return {
    userId: data.user_id,
    role: data.role,
    displayName: data.display_name,
    isActive: data.is_active,
    createdAt: data.created_at,
  };
}
