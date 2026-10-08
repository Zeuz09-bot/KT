/**
 * Keraunous Tech Store — Unit Tests: Content & Settings (U06)
 *
 * Verifies pure logic:
 * - Internal link validation (§U06 item 6)
 * - Banner schema & date window validation
 * - Flash sale campaign schema & date window validation
 * - Trust bar schema (exactly 4 items, fixed icon set)
 * - Site settings schema (Nigerian E.164 phone, hold_hours range, flags)
 * - Non-public settings privacy projection (§U06 item 5)
 */

import { describe, it, expect } from 'vitest';
import {
  isValidInternalPath,
  InternalPathSchema,
  OptionalInternalPathSchema,
  NigerianPhoneSchema,
  TRUST_BAR_ICONS,
  TrustBarItemSchema,
  TrustBarSchema,
  BannerSchema,
  CampaignSchema,
  SiteSettingsSchema,
  PublicSettingsSchema,
} from '@/lib/contracts/content';

// ---------------------------------------------------------------------------
// 1. Link validation (§U06 item 6: must match ^/[A-Za-z0-9/_\-?=&%.]*$)
// ---------------------------------------------------------------------------

describe('Link validation', () => {
  it('accepts valid internal root and nested paths', () => {
    expect(isValidInternalPath('/')).toBe(true);
    expect(isValidInternalPath('/shop')).toBe(true);
    expect(isValidInternalPath('/shop/phones')).toBe(true);
    expect(isValidInternalPath('/products/iphone-15-pro-max')).toBe(true);
  });

  it('accepts internal paths with query parameters and URL encoding', () => {
    expect(isValidInternalPath('/shop?category=phones&sort=price_asc')).toBe(true);
    expect(isValidInternalPath('/search?q=samsung%20galaxy')).toBe(true);
    expect(isValidInternalPath('/deals?discount=20&brand=apple_corp')).toBe(true);
  });

  it('rejects external URLs with http or https', () => {
    expect(isValidInternalPath('https://example.com')).toBe(false);
    expect(isValidInternalPath('http://malicious-site.ng/login')).toBe(false);
  });

  it('rejects protocol-relative URLs', () => {
    expect(isValidInternalPath('//google.com')).toBe(false);
    expect(isValidInternalPath('//malicious.com/phish')).toBe(false);
  });

  it('rejects javascript: and other dangerous pseudo-protocols', () => {
    expect(isValidInternalPath('javascript:alert(1)')).toBe(false);
    expect(isValidInternalPath('data:text/html;base64,...')).toBe(false);
    expect(isValidInternalPath('vbscript:msgbox(1)')).toBe(false);
  });

  it('rejects relative paths that do not start with /', () => {
    expect(isValidInternalPath('shop/phones')).toBe(false);
    expect(isValidInternalPath('products')).toBe(false);
  });

  it('treats null/undefined as valid for optional paths', () => {
    expect(isValidInternalPath(null)).toBe(true);
    expect(isValidInternalPath(undefined)).toBe(true);
  });

  it('OptionalInternalPathSchema parses valid path and transforms empty string to null', () => {
    expect(OptionalInternalPathSchema.parse('/shop/phones')).toBe('/shop/phones');
    expect(OptionalInternalPathSchema.parse('')).toBe(null);
    expect(OptionalInternalPathSchema.parse(null)).toBe(null);
    expect(OptionalInternalPathSchema.parse(undefined)).toBe(null);
    expect(() => OptionalInternalPathSchema.parse('https://evil.com')).toThrow();
  });
});

// ---------------------------------------------------------------------------
// 2. Banner Schema
// ---------------------------------------------------------------------------

describe('BannerSchema', () => {
  const validBanner = {
    type: 'hero' as const,
    eyebrow: 'New Release',
    title: 'iPhone 16 Pro Max',
    subtitle: 'Titanium design with A18 Pro chip',
    cta_label: 'Order Now',
    cta_href: '/products/iphone-16-pro-max',
    image_path: 'banners/hero-iphone16.webp',
    sort_order: 1,
    is_active: true,
  };

  it('validates a complete hero banner', () => {
    const parsed = BannerSchema.parse(validBanner);
    expect(parsed.title).toBe('iPhone 16 Pro Max');
    expect(parsed.type).toBe('hero');
    expect(parsed.cta_href).toBe('/products/iphone-16-pro-max');
  });

  it('validates a promo banner with minimal fields', () => {
    const promo = {
      type: 'promo' as const,
      title: 'Weekend Flash Sale',
      image_path: 'banners/promo-weekend.webp',
    };
    const parsed = BannerSchema.parse(promo);
    expect(parsed.type).toBe('promo');
    expect(parsed.sort_order).toBe(0);
    expect(parsed.is_active).toBe(true);
  });

  it('rejects invalid banner types', () => {
    expect(() =>
      BannerSchema.parse({
        ...validBanner,
        type: 'sidebar',
      }),
    ).toThrow();
  });

  it('rejects empty title or image path', () => {
    expect(() =>
      BannerSchema.parse({
        ...validBanner,
        title: '',
      }),
    ).toThrow();

    expect(() =>
      BannerSchema.parse({
        ...validBanner,
        image_path: '',
      }),
    ).toThrow();
  });

  it('rejects external cta_href', () => {
    expect(() =>
      BannerSchema.parse({
        ...validBanner,
        cta_href: 'https://external-store.com/buy',
      }),
    ).toThrow();
  });

  it('allows valid schedule when ends_at is after starts_at', () => {
    const scheduled = {
      ...validBanner,
      starts_at: '2026-10-01T00:00:00.000Z',
      ends_at: '2026-10-10T00:00:00.000Z',
    };
    const parsed = BannerSchema.parse(scheduled);
    expect(parsed.starts_at).toBe('2026-10-01T00:00:00.000Z');
  });

  it('rejects schedule when ends_at is before starts_at', () => {
    const invalidSchedule = {
      ...validBanner,
      starts_at: '2026-10-10T00:00:00.000Z',
      ends_at: '2026-10-01T00:00:00.000Z',
    };
    expect(() => BannerSchema.parse(invalidSchedule)).toThrow(/End date must be after start date/);
  });

  it('transforms empty product_id string to null', () => {
    const withEmptyProduct = {
      ...validBanner,
      product_id: '',
    };
    const parsed = BannerSchema.parse(withEmptyProduct);
    expect(parsed.product_id).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 3. Campaign Schema (Flash Sale)
// ---------------------------------------------------------------------------

describe('CampaignSchema', () => {
  const validCampaign = {
    title: 'Independence Day Tech Blitz',
    subtitle: 'Up to 30% off selected flagship smartphones',
    href: '/shop/deals',
    starts_at: '2026-10-01T08:00:00.000Z',
    ends_at: '2026-10-15T23:59:59.000Z',
    is_active: true,
  };

  it('validates a complete active flash sale campaign', () => {
    const parsed = CampaignSchema.parse(validCampaign);
    expect(parsed.title).toBe('Independence Day Tech Blitz');
    expect(parsed.ends_at).toBe('2026-10-15T23:59:59.000Z');
  });

  it('requires ends_at for a flash sale campaign', () => {
    const { ends_at, ...missingEndsAt } = validCampaign;
    expect(() => CampaignSchema.parse(missingEndsAt)).toThrow();
  });

  it('rejects external link in campaign href', () => {
    expect(() =>
      CampaignSchema.parse({
        ...validCampaign,
        href: 'https://other-shop.com',
      }),
    ).toThrow();
  });

  it('rejects campaign where ends_at is before starts_at', () => {
    expect(() =>
      CampaignSchema.parse({
        ...validCampaign,
        starts_at: '2026-10-20T00:00:00.000Z',
        ends_at: '2026-10-10T00:00:00.000Z',
      }),
    ).toThrow(/End date must be after start date/);
  });
});

// ---------------------------------------------------------------------------
// 4. Trust Bar Schema (§U06 item 3: 4 items, fixed icon set)
// ---------------------------------------------------------------------------

describe('TrustBarSchema', () => {
  const sampleItem = {
    icon: 'shield' as const,
    title: 'Genuine Products',
    subtitle: 'Every item tested and verified authentic',
  };

  it('validates a trust bar item with an allowed icon', () => {
    const parsed = TrustBarItemSchema.parse(sampleItem);
    expect(parsed.icon).toBe('shield');
    expect(parsed.title).toBe('Genuine Products');
  });

  it('accepts all icons in the fixed icon set', () => {
    for (const icon of TRUST_BAR_ICONS) {
      const parsed = TrustBarItemSchema.parse({
        icon,
        title: 'Title',
        subtitle: 'Subtitle',
      });
      expect(parsed.icon).toBe(icon);
    }
  });

  it('rejects icons outside the fixed icon set', () => {
    expect(() =>
      TrustBarItemSchema.parse({
        icon: 'credit-card', // Not allowed - no online payments!
        title: 'Card Payment',
        subtitle: 'Secure payments',
      }),
    ).toThrow();
  });

  it('validates a complete 4-item trust bar', () => {
    const items = [
      { icon: 'shield', title: 'Genuine Products', subtitle: 'Tested & verified' },
      { icon: 'truck', title: 'Nationwide Delivery', subtitle: 'Lagos, Ondo, Abuja & more' },
      { icon: 'message-circle', title: 'WhatsApp Support', subtitle: 'Fast response 24/7' },
      { icon: 'refresh-cw', title: 'Inspect Before Pay', subtitle: 'Available in Ondo State' },
    ];
    const parsed = TrustBarSchema.parse(items);
    expect(parsed).toHaveLength(4);
  });

  it('rejects trust bar with fewer or more than 4 items', () => {
    const threeItems = [
      { icon: 'shield', title: 'T1', subtitle: 'S1' },
      { icon: 'truck', title: 'T2', subtitle: 'S2' },
      { icon: 'star', title: 'T3', subtitle: 'S3' },
    ];
    expect(() => TrustBarSchema.parse(threeItems)).toThrow(/exactly 4 items/);

    const fiveItems = [...threeItems, sampleItem, sampleItem];
    expect(() => TrustBarSchema.parse(fiveItems)).toThrow(/exactly 4 items/);
  });
});

// ---------------------------------------------------------------------------
// 5. Site Settings Schema
// ---------------------------------------------------------------------------

describe('SiteSettingsSchema', () => {
  const validSettings = {
    whatsapp_number: '+2348070822409',
    business_name: 'Keraunous Tech Store',
    business_hours: 'Mon - Sat: 8:00 AM - 8:00 PM',
    address: 'Akure, Ondo State, Nigeria',
    delivery_info: 'Interstate delivery within 24-48 hours via trusted couriers',
    announcement: 'New iPhone 16 stock just arrived!',
    whatsapp_channel_url: 'https://whatsapp.com/channel/test',
    socials: {
      instagram: 'https://instagram.com/keraunous',
      twitter: 'https://twitter.com/keraunous',
    },
    official_account_name: 'Keraunous Tech Store',
    hold_hours: 24,
    orders_enabled: true,
    maintenance_mode: false,
    order_message_template: 'Hello Keraunous, I would like to confirm my order',
  };

  it('validates complete owner settings', () => {
    const parsed = SiteSettingsSchema.parse(validSettings);
    expect(parsed.whatsapp_number).toBe('+2348070822409');
    expect(parsed.hold_hours).toBe(24);
    expect(parsed.orders_enabled).toBe(true);
  });

  describe('Nigerian phone validation', () => {
    it('accepts valid Nigerian phone numbers with +234', () => {
      expect(NigerianPhoneSchema.parse('+2348070822409')).toBe('+2348070822409');
      expect(NigerianPhoneSchema.parse('+2349012345678')).toBe('+2349012345678');
      expect(NigerianPhoneSchema.parse('+2347031112233')).toBe('+2347031112233');
      expect(NigerianPhoneSchema.parse('+2348123456789')).toBe('+2348123456789');
    });

    it('rejects local format without +234 prefix', () => {
      expect(() => NigerianPhoneSchema.parse('08070822409')).toThrow();
    });

    it('rejects non-Nigerian country codes', () => {
      expect(() => NigerianPhoneSchema.parse('+12025550143')).toThrow();
      expect(() => NigerianPhoneSchema.parse('+447911123456')).toThrow();
    });

    it('rejects invalid prefixes or wrong length', () => {
      expect(() => NigerianPhoneSchema.parse('+234501234567')).toThrow();
      expect(() => NigerianPhoneSchema.parse('+234801234')).toThrow();
      expect(() => NigerianPhoneSchema.parse('invalid')).toThrow();
    });
  });

  describe('hold_hours boundary tests', () => {
    it('accepts hold_hours between 1 and 168', () => {
      expect(SiteSettingsSchema.parse({ ...validSettings, hold_hours: 1 }).hold_hours).toBe(1);
      expect(SiteSettingsSchema.parse({ ...validSettings, hold_hours: 48 }).hold_hours).toBe(48);
      expect(SiteSettingsSchema.parse({ ...validSettings, hold_hours: 168 }).hold_hours).toBe(168);
    });

    it('rejects hold_hours less than 1 or greater than 168', () => {
      expect(() => SiteSettingsSchema.parse({ ...validSettings, hold_hours: 0 })).toThrow();
      expect(() => SiteSettingsSchema.parse({ ...validSettings, hold_hours: -5 })).toThrow();
      expect(() => SiteSettingsSchema.parse({ ...validSettings, hold_hours: 169 })).toThrow();
    });
  });

  it('rejects empty business_name, address, or hours', () => {
    expect(() => SiteSettingsSchema.parse({ ...validSettings, business_name: '' })).toThrow();
    expect(() => SiteSettingsSchema.parse({ ...validSettings, address: '' })).toThrow();
    expect(() => SiteSettingsSchema.parse({ ...validSettings, business_hours: '' })).toThrow();
  });
});

// ---------------------------------------------------------------------------
// 6. Non-public settings privacy projection (§U06 item 5)
// ---------------------------------------------------------------------------

describe('Public settings projection', () => {
  it('validates public projection shape', () => {
    const publicData = {
      businessName: 'Keraunous Tech Store',
      businessHours: '24/7',
      address: 'Ondo State, Nigeria',
      deliveryInfo: 'Nationwide delivery available',
      announcement: 'Special offer today',
      socials: { instagram: '@keraunous' },
      officialAccountName: 'Keraunous Tech Store',
      trustBar: [
        { icon: 'shield', title: 'T1', subtitle: 'S1' },
        { icon: 'truck', title: 'T2', subtitle: 'S2' },
        { icon: 'message-circle', title: 'T3', subtitle: 'S3' },
        { icon: 'refresh-cw', title: 'T4', subtitle: 'S4' },
      ],
    };

    const parsed = PublicSettingsSchema.parse(publicData);
    expect(parsed.businessName).toBe('Keraunous Tech Store');
    expect(parsed.officialAccountName).toBe('Keraunous Tech Store');
  });

  it('ensures secret/admin-only fields are NOT part of PublicSettings', () => {
    // TypeScript check: whatsapp_number, hold_hours, orders_enabled, maintenance_mode,
    // order_message_template must not exist on PublicSettings
    const publicKeys = Object.keys(PublicSettingsSchema.shape);
    expect(publicKeys).not.toContain('whatsapp_number');
    expect(publicKeys).not.toContain('hold_hours');
    expect(publicKeys).not.toContain('orders_enabled');
    expect(publicKeys).not.toContain('maintenance_mode');
    expect(publicKeys).not.toContain('order_message_template');
    expect(publicKeys).not.toContain('whatsapp_channel_url');
  });
});
