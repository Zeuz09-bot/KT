/**
 * Content & Settings Data Repository
 * Queries public site settings, promotional banners, and flash sale campaigns.
 * Also provides admin CRUD for content and owner-only settings.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type {
  BannerInput,
  CampaignInput,
  TrustBarItem,
  PublicSiteContent,
  PublicSettings,
  UpdateSettingsInput,
} from '@/lib/contracts/content';

export type BannerRow = Database['public']['Tables']['banners']['Row'];
export type CampaignRow = Database['public']['Tables']['campaigns']['Row'];
export type SiteSettingRow = Database['public']['Tables']['site_settings']['Row'];

export const DEFAULT_TRUST_BAR: TrustBarItem[] = [
  { icon: 'shield', title: 'Genuine Products', subtitle: 'Every item verified authentic' },
  { icon: 'truck', title: 'Nationwide Delivery', subtitle: 'Fast delivery across Nigeria' },
  { icon: 'message-circle', title: 'WhatsApp Support', subtitle: 'Chat with us 24/7' },
  { icon: 'refresh-cw', title: 'Inspect Before You Pay', subtitle: 'Pickup available in Ondo State' },
];

export const DEFAULT_PUBLIC_SETTINGS: PublicSettings = {
  businessName: 'Keraunous Tech Store',
  businessHours: '24/7',
  address: 'Ondo State, Nigeria',
  deliveryInfo: 'Nationwide delivery available',
  announcement: null,
  socials: {},
  officialAccountName: 'Keraunous Tech Store',
  trustBar: DEFAULT_TRUST_BAR,
};

// ---------------------------------------------------------------------------
// Public Readers
// ---------------------------------------------------------------------------

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
  const now = new Date().toISOString();
  let query = supabase
    .from('banners')
    .select('*')
    .eq('is_active', true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gt.${now}`)
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
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('is_active', true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .gt('ends_at', now)
    .order('starts_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * Public consolidated site content reader cached with tag 'home'.
 * Returns ONLY safe, public data: no WhatsApp number, hold hours, flags, or templates.
 */
export async function getSiteContent(
  supabase: SupabaseClient<Database>,
): Promise<PublicSiteContent> {
  const [settingsRaw, heroBanners, promoBanners, activeCampaigns] = await Promise.all([
    getPublicSiteSettings(supabase),
    getActiveBanners(supabase, 'hero'),
    getActiveBanners(supabase, 'promo'),
    getActiveCampaigns(supabase),
  ]);

  const rawTrustBar = settingsRaw['trust_bar'];
  const trustBar: TrustBarItem[] =
    Array.isArray(rawTrustBar) && rawTrustBar.length === 4
      ? (rawTrustBar as TrustBarItem[])
      : DEFAULT_TRUST_BAR;

  const settings: PublicSettings = {
    businessName: typeof settingsRaw['business_name'] === 'string'
      ? settingsRaw['business_name']
      : DEFAULT_PUBLIC_SETTINGS.businessName,
    businessHours: typeof settingsRaw['business_hours'] === 'string'
      ? settingsRaw['business_hours']
      : DEFAULT_PUBLIC_SETTINGS.businessHours,
    address: typeof settingsRaw['address'] === 'string'
      ? settingsRaw['address']
      : DEFAULT_PUBLIC_SETTINGS.address,
    deliveryInfo: typeof settingsRaw['delivery_info'] === 'string'
      ? settingsRaw['delivery_info']
      : DEFAULT_PUBLIC_SETTINGS.deliveryInfo,
    announcement: typeof settingsRaw['announcement'] === 'string'
      ? settingsRaw['announcement']
      : null,
    socials: (typeof settingsRaw['socials'] === 'object' && settingsRaw['socials'] !== null)
      ? (settingsRaw['socials'] as Record<string, string>)
      : {},
    officialAccountName: typeof settingsRaw['official_account_name'] === 'string'
      ? settingsRaw['official_account_name']
      : DEFAULT_PUBLIC_SETTINGS.officialAccountName,
    trustBar,
  };

  return {
    settings,
    heroBanners: heroBanners.map((b) => ({
      id: b.id,
      type: 'hero',
      eyebrow: b.eyebrow,
      title: b.title,
      subtitle: b.subtitle,
      cta_label: b.cta_label,
      cta_href: b.cta_href,
      image_path: b.image_path,
      product_id: b.product_id,
      sort_order: b.sort_order,
    })),
    promoBanners: promoBanners.map((b) => ({
      id: b.id,
      type: 'promo',
      eyebrow: b.eyebrow,
      title: b.title,
      subtitle: b.subtitle,
      cta_label: b.cta_label,
      cta_href: b.cta_href,
      image_path: b.image_path,
      product_id: b.product_id,
      sort_order: b.sort_order,
    })),
    activeCampaign: activeCampaigns.length > 0
      ? {
          id: activeCampaigns[0].id,
          title: activeCampaigns[0].title,
          subtitle: activeCampaigns[0].subtitle,
          href: activeCampaigns[0].href,
          starts_at: activeCampaigns[0].starts_at,
          ends_at: activeCampaigns[0].ends_at,
        }
      : null,
  };
}

// ---------------------------------------------------------------------------
// Admin Banners CRUD
// ---------------------------------------------------------------------------

export async function adminListBanners(
  supabase: SupabaseClient<Database>,
): Promise<BannerRow[]> {
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .order('type', { ascending: true })
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function adminGetBanner(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<BannerRow | null> {
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function adminCreateBanner(
  supabase: SupabaseClient<Database>,
  input: BannerInput,
): Promise<BannerRow> {
  const { data, error } = await supabase
    .from('banners')
    .insert({
      type: input.type,
      eyebrow: input.eyebrow ?? null,
      title: input.title,
      subtitle: input.subtitle ?? null,
      cta_label: input.cta_label ?? null,
      cta_href: input.cta_href ?? null,
      image_path: input.image_path,
      product_id: input.product_id ?? null,
      starts_at: input.starts_at ?? null,
      ends_at: input.ends_at ?? null,
      sort_order: input.sort_order,
      is_active: input.is_active,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function adminUpdateBanner(
  supabase: SupabaseClient<Database>,
  id: string,
  input: BannerInput,
): Promise<BannerRow> {
  const { data, error } = await supabase
    .from('banners')
    .update({
      type: input.type,
      eyebrow: input.eyebrow ?? null,
      title: input.title,
      subtitle: input.subtitle ?? null,
      cta_label: input.cta_label ?? null,
      cta_href: input.cta_href ?? null,
      image_path: input.image_path,
      product_id: input.product_id ?? null,
      starts_at: input.starts_at ?? null,
      ends_at: input.ends_at ?? null,
      sort_order: input.sort_order,
      is_active: input.is_active,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function adminDeleteBanner(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from('banners')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Admin Campaigns (Flash Sale)
// ---------------------------------------------------------------------------

export async function adminListCampaigns(
  supabase: SupabaseClient<Database>,
): Promise<CampaignRow[]> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('ends_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function adminGetCampaign(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<CampaignRow | null> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function adminSaveCampaign(
  supabase: SupabaseClient<Database>,
  input: CampaignInput,
): Promise<CampaignRow> {
  if (input.id) {
    const { data, error } = await supabase
      .from('campaigns')
      .update({
        title: input.title,
        subtitle: input.subtitle ?? null,
        href: input.href ?? null,
        starts_at: input.starts_at ?? null,
        ends_at: input.ends_at,
        is_active: input.is_active,
      })
      .eq('id', input.id)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        title: input.title,
        subtitle: input.subtitle ?? null,
        href: input.href ?? null,
        starts_at: input.starts_at ?? null,
        ends_at: input.ends_at,
        is_active: input.is_active,
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }
}

// ---------------------------------------------------------------------------
// Admin Settings (Owner Only)
// ---------------------------------------------------------------------------

export async function adminGetAllSettings(
  supabase: SupabaseClient<Database>,
): Promise<Record<string, unknown>> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('key, value, is_public');

  if (error) throw error;
  const settings: Record<string, unknown> = {};
  data?.forEach((row) => {
    settings[row.key] = row.value;
  });
  return settings;
}

const PUBLIC_SETTING_KEYS = new Set([
  'business_name',
  'business_hours',
  'address',
  'delivery_info',
  'announcement',
  'socials',
  'official_account_name',
  'trust_bar',
]);

export async function adminUpdateSettings(
  supabase: SupabaseClient<Database>,
  settings: UpdateSettingsInput,
  userId?: string,
): Promise<void> {
  const entries = Object.entries(settings);
  for (const [key, val] of entries) {
    if (val === undefined) continue;
    const isPublic = PUBLIC_SETTING_KEYS.has(key);
    const { error } = await supabase
      .from('site_settings')
      .upsert(
        {
          key,
          value: val as Database['public']['Tables']['site_settings']['Insert']['value'],
          is_public: isPublic,
          updated_at: new Date().toISOString(),
          updated_by: userId ?? null,
        },
        { onConflict: 'key' },
      );

    if (error) throw error;
  }
}
