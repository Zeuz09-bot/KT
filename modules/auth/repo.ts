/**
 * Admin Authentication Data Repository
 * Queries and updates admin_users roles and active status.
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

export async function listAdminUsers(
  supabase: SupabaseClient<Database>,
): Promise<AdminUserProfile[]> {
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  return data.map((row) => ({
    userId: row.user_id,
    role: row.role,
    displayName: row.display_name,
    isActive: row.is_active,
    createdAt: row.created_at,
  }));
}

export async function updateAdminUserStatus(
  supabase: SupabaseClient<Database>,
  userId: string,
  isActive: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from('admin_users')
    .update({ is_active: isActive })
    .eq('user_id', userId);

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function updateAdminUserRole(
  supabase: SupabaseClient<Database>,
  userId: string,
  role: AdminRole,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from('admin_users')
    .update({ role })
    .eq('user_id', userId);

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
