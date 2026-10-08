/**
 * Keraunous Tech Store — Content & Settings Contracts (U06)
 *
 * Zod schemas and TypeScript types for banners, flash sale campaigns,
 * trust bar items, site settings, and public site content.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Helpers & Primitives
// ---------------------------------------------------------------------------

export const INTERNAL_PATH_REGEX = /^\/[A-Za-z0-9/_\-?=&%.]*$/;

export function isValidInternalPath(path: string | null | undefined): boolean {
  if (!path) return true;
  if (!path.startsWith('/')) return false;
  if (path.startsWith('//')) return false;
  return INTERNAL_PATH_REGEX.test(path);
}

export const InternalPathSchema = z
  .string()
  .trim()
  .refine(
    (val) => isValidInternalPath(val),
    'Must be a valid internal path starting with / (e.g. /shop/deals)',
  );

export const OptionalInternalPathSchema = z
  .string()
  .trim()
  .nullish()
  .transform((val) => (!val ? null : val))
  .refine(
    (val) => isValidInternalPath(val),
    'Must be a valid internal path starting with / (e.g. /shop/deals)',
  );

/** Nigerian E.164 phone number (+234...) */
export const NigerianPhoneSchema = z
  .string()
  .trim()
  .regex(
    /^\+234[789][01][0-9]{8}$/,
    'Must be a valid Nigerian phone number in +234 format (e.g. +2348012345678)',
  );

// ---------------------------------------------------------------------------
// Trust Bar
// ---------------------------------------------------------------------------

export const TRUST_BAR_ICONS = [
  'shield',
  'truck',
  'message-circle',
  'refresh-cw',
  'check-circle',
  'star',
  'clock',
  'map-pin',
] as const;

export type TrustBarIcon = (typeof TRUST_BAR_ICONS)[number];

export const TrustBarItemSchema = z.object({
  icon: z.enum(TRUST_BAR_ICONS, {
    errorMap: () => ({ message: 'Invalid icon selected' }),
  }),
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(60, 'Title must be 60 characters or fewer'),
  subtitle: z
    .string()
    .trim()
    .min(1, 'Subtitle is required')
    .max(120, 'Subtitle must be 120 characters or fewer'),
});

export type TrustBarItem = z.infer<typeof TrustBarItemSchema>;

export const TrustBarSchema = z
  .array(TrustBarItemSchema)
  .length(4, 'Trust bar must contain exactly 4 items');

export type TrustBar = z.infer<typeof TrustBarSchema>;

// ---------------------------------------------------------------------------
// Banners
// ---------------------------------------------------------------------------

export const BANNER_TYPES = ['hero', 'promo'] as const;
export type BannerType = (typeof BANNER_TYPES)[number];

export const BannerSchema = z
  .object({
    id: z.string().uuid().optional(),
    type: z.enum(BANNER_TYPES),
    eyebrow: z
      .string()
      .trim()
      .max(60, 'Eyebrow must be 60 characters or fewer')
      .nullable()
      .optional()
      .transform((val) => (val === '' ? null : val)),
    title: z
      .string()
      .trim()
      .min(1, 'Title is required')
      .max(100, 'Title must be 100 characters or fewer'),
    subtitle: z
      .string()
      .trim()
      .max(200, 'Subtitle must be 200 characters or fewer')
      .nullable()
      .optional()
      .transform((val) => (val === '' ? null : val)),
    cta_label: z
      .string()
      .trim()
      .max(50, 'CTA label must be 50 characters or fewer')
      .nullable()
      .optional()
      .transform((val) => (val === '' ? null : val)),
    cta_href: OptionalInternalPathSchema,
    image_path: z
      .string()
      .trim()
      .min(1, 'Image path is required')
      .max(500, 'Image path is too long'),
    product_id: z
      .string()
      .uuid()
      .nullable()
      .optional()
      .or(z.literal(''))
      .transform((val) => (!val ? null : val)),
    starts_at: z
      .string()
      .nullable()
      .optional()
      .transform((val) => (val === '' ? null : val)),
    ends_at: z
      .string()
      .nullable()
      .optional()
      .transform((val) => (val === '' ? null : val)),
    sort_order: z.coerce.number().int().min(0).default(0),
    is_active: z.boolean().default(true),
  })
  .refine(
    (data) => {
      if (data.starts_at && data.ends_at) {
        return new Date(data.ends_at) > new Date(data.starts_at);
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['ends_at'],
    },
  );

export type BannerInput = z.infer<typeof BannerSchema>;

// ---------------------------------------------------------------------------
// Flash Sale Campaign
// ---------------------------------------------------------------------------

export const CampaignSchema = z
  .object({
    id: z.string().uuid().optional(),
    title: z
      .string()
      .trim()
      .min(1, 'Title is required')
      .max(100, 'Title must be 100 characters or fewer'),
    subtitle: z
      .string()
      .trim()
      .max(200, 'Subtitle must be 200 characters or fewer')
      .nullable()
      .optional()
      .transform((val) => (val === '' ? null : val)),
    href: OptionalInternalPathSchema,
    starts_at: z
      .string()
      .nullable()
      .optional()
      .transform((val) => (val === '' ? null : val)),
    ends_at: z.string().min(1, 'End date and time is required'),
    is_active: z.boolean().default(true),
  })
  .refine(
    (data) => {
      if (data.starts_at && data.ends_at) {
        return new Date(data.ends_at) > new Date(data.starts_at);
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['ends_at'],
    },
  );

export type CampaignInput = z.infer<typeof CampaignSchema>;

// ---------------------------------------------------------------------------
// Site Settings (Owner Only)
// ---------------------------------------------------------------------------

export const SiteSettingsSchema = z.object({
  whatsapp_number: NigerianPhoneSchema,
  business_name: z
    .string()
    .trim()
    .min(1, 'Business name is required')
    .max(100, 'Business name must be 100 characters or fewer'),
  business_hours: z
    .string()
    .trim()
    .min(1, 'Business hours are required')
    .max(100, 'Business hours must be 100 characters or fewer'),
  address: z
    .string()
    .trim()
    .min(1, 'Address is required')
    .max(200, 'Address must be 200 characters or fewer'),
  delivery_info: z
    .string()
    .trim()
    .min(1, 'Delivery info is required')
    .max(300, 'Delivery info must be 300 characters or fewer'),
  announcement: z
    .string()
    .trim()
    .max(200, 'Announcement must be 200 characters or fewer')
    .nullable()
    .optional()
    .transform((val) => (val === '' ? null : val)),
  whatsapp_channel_url: z
    .string()
    .trim()
    .url('Must be a valid URL')
    .nullable()
    .optional()
    .or(z.literal(''))
    .transform((val) => (!val ? null : val)),
  socials: z
    .object({
      instagram: z.string().trim().optional(),
      twitter: z.string().trim().optional(),
      facebook: z.string().trim().optional(),
      tiktok: z.string().trim().optional(),
    })
    .default({}),
  official_account_name: z
    .string()
    .trim()
    .min(1, 'Official account name is required')
    .max(100, 'Official account name must be 100 characters or fewer'),
  hold_hours: z.coerce
    .number()
    .int('Hold hours must be an integer')
    .min(1, 'Hold hours must be at least 1')
    .max(168, 'Hold hours cannot exceed 168 (7 days)')
    .default(24),
  orders_enabled: z.boolean().default(true),
  maintenance_mode: z.boolean().default(false),
  order_message_template: z
    .string()
    .trim()
    .max(1000, 'Message template must be 1000 characters or fewer')
    .nullable()
    .optional()
    .transform((val) => (val === '' ? null : val)),
  trust_bar: TrustBarSchema.optional(),
});

export type SiteSettingsInput = z.infer<typeof SiteSettingsSchema>;
export type UpdateSettingsInput = Partial<SiteSettingsInput>;

// ---------------------------------------------------------------------------
// Public Site Content (getSiteContent())
// ---------------------------------------------------------------------------

export const PublicSettingsSchema = z.object({
  businessName: z.string(),
  businessHours: z.string(),
  address: z.string(),
  deliveryInfo: z.string(),
  announcement: z.string().nullable(),
  socials: z.record(z.string()),
  officialAccountName: z.string(),
  trustBar: TrustBarSchema,
});

export type PublicSettings = z.infer<typeof PublicSettingsSchema>;

export interface PublicSiteContent {
  settings: PublicSettings;
  heroBanners: Array<{
    id: string;
    type: 'hero';
    eyebrow: string | null;
    title: string;
    subtitle: string | null;
    cta_label: string | null;
    cta_href: string | null;
    image_path: string;
    product_id: string | null;
    sort_order: number;
  }>;
  promoBanners: Array<{
    id: string;
    type: 'promo';
    eyebrow: string | null;
    title: string;
    subtitle: string | null;
    cta_label: string | null;
    cta_href: string | null;
    image_path: string;
    product_id: string | null;
    sort_order: number;
  }>;
  activeCampaign: {
    id: string;
    title: string;
    subtitle: string | null;
    href: string | null;
    starts_at: string | null;
    ends_at: string;
  } | null;
}
