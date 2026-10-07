/**
 * Content & Settings Data Repository
 * Queries public site settings, promotional banners, and flash sale campaigns.
 */
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

export type BannerRow = Database['public']['Tables']['banners']['Row'];
export type CampaignRow = Database['public']['Tables']['campaigns']['Row'];

export async function getPublicSiteSettings(
  supabase: SupabaseClient<Database>,
): Promise<Record<string, unknown>> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('key, value')
    .eq('is_public', true);

  if (error) throw error;
  const settings: Record<string, unknown> = {};
  data?.forEach((row) => {
    settings[row.key] = row.value;
  });
  return settings;
}

export async function getActiveBanners(
  supabase: SupabaseClient<Database>,
  type?: 'hero' | 'promo',
): Promise<BannerRow[]> {
  let query = supabase
    .from('banners')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getActiveCampaigns(
  supabase: SupabaseClient<Database>,
): Promise<CampaignRow[]> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('is_active', true)
    .gt('ends_at', new Date().toISOString())
    .order('starts_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}
