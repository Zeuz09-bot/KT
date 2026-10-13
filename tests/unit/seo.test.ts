import { describe, it, expect } from 'vitest';
import {
  buildProductJsonLd,
  buildLocalBusinessJsonLd,
  buildBreadcrumbsJsonLd,
} from '@/lib/seo/json-ld';
import { extractUtmParams, isValidAnalyticsEvent } from '@/lib/analytics/tracker';

describe('SEO & Structured Data (JSON-LD) (U14)', () => {
  it('builds a valid Schema.org Product object with Naira pricing and NO aggregateRating', () => {
    const mockProduct = {
      name: 'iPhone 15 Pro Max',
      slug: 'iphone-15-pro-max',
      description: 'Super retina XDR display with titanium design.',
      brand: { name: 'Apple', slug: 'apple' },
      category: { name: 'Smartphones', slug: 'smartphones' },
      images: [{ path: 'https://cdn.keraunous.ng/iphone.webp', is_primary: true }],
      variants: [
        {
          sku: 'IPHONE15PM-256-TI',
          condition: 'brand_new',
          price_ngn: 1850000,
          stock_qty: 3,
        },
        {
          sku: 'IPHONE15PM-512-TI',
          condition: 'uk_used',
          price_ngn: 1650000,
          stock_qty: 0,
        },
      ],
    };

    const schema = buildProductJsonLd(mockProduct as any, 'https://keraunous.ng');

    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('Product');
    expect(schema.name).toBe('iPhone 15 Pro Max');
    expect(schema.brand?.name).toBe('Apple');
    expect(schema.image).toContain('https://cdn.keraunous.ng/iphone.webp');

    // Offers array
    expect(Array.isArray(schema.offers)).toBe(true);
    expect(schema.offers?.length).toBe(2);
    expect(schema.offers?.[0].priceCurrency).toBe('NGN');
    expect(schema.offers?.[0].price).toBe(1850000);
    expect(schema.offers?.[0].availability).toBe('https://schema.org/InStock');
    expect(schema.offers?.[0].itemCondition).toBe('https://schema.org/NewCondition');

    expect(schema.offers?.[1].availability).toBe('https://schema.org/OutOfStock');
    expect(schema.offers?.[1].itemCondition).toBe('https://schema.org/UsedCondition');

    // Strict Non-Negotiable: No fake aggregateRating
    expect((schema as any).aggregateRating).toBeUndefined();
    expect((schema as any).review).toBeUndefined();
  });

  it('builds LocalBusiness / ElectronicsStore schema with Ondo State location', () => {
    const schema = buildLocalBusinessJsonLd('https://keraunous.ng');

    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('ElectronicsStore');
    expect(schema.name).toBe('Keraunous Tech Store');
    expect(schema.telephone).toBe('+2348070822409');
    expect(schema.address.addressRegion).toBe('Ondo State');
    expect(schema.address.addressCountry).toBe('NG');
    expect(schema.priceRange).toBeDefined();
  });

  it('builds BreadcrumbList schema with sequential positions', () => {
    const crumbs = [
      { name: 'Home', url: 'https://keraunous.ng' },
      { name: 'Smartphones', url: 'https://keraunous.ng/category/smartphones' },
      { name: 'iPhone 15', url: 'https://keraunous.ng/product/iphone-15' },
    ];

    const schema = buildBreadcrumbsJsonLd(crumbs);

    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('BreadcrumbList');
    expect(schema.itemListElement.length).toBe(3);
    expect(schema.itemListElement[0].position).toBe(1);
    expect(schema.itemListElement[0].name).toBe('Home');
    expect(schema.itemListElement[2].position).toBe(3);
    expect(schema.itemListElement[2].name).toBe('iPhone 15');
  });
});

describe('Analytics & UTM Tracking (U14)', () => {
  it('extracts and cleans standard UTM parameters from search params', () => {
    const params = new URLSearchParams({
      utm_source: 'whatsapp',
      utm_medium: 'broadcast',
      utm_campaign: 'flash_sale_oct',
      utm_term: 'iphone',
      utm_content: 'banner1',
      extra_unrelated: 'ignored',
    });

    const utm = extractUtmParams(params);

    expect(utm).toEqual({
      source: 'whatsapp',
      medium: 'broadcast',
      campaign: 'flash_sale_oct',
      term: 'iphone',
      content: 'banner1',
    });
  });

  it('ignores UTM extraction when no utm parameters are present', () => {
    const params = new URLSearchParams({ id: '123' });
    const utm = extractUtmParams(params);
    expect(utm).toBeNull();
  });

  it('validates allowed privacy-safe analytics events without PII', () => {
    expect(isValidAnalyticsEvent('view_product')).toBe(true);
    expect(isValidAnalyticsEvent('add_to_list')).toBe(true);
    expect(isValidAnalyticsEvent('order_created')).toBe(true);
    expect(isValidAnalyticsEvent('whatsapp_opened')).toBe(true);
    expect(isValidAnalyticsEvent('track_lookup')).toBe(true);
    expect(isValidAnalyticsEvent('unknown_event' as any)).toBe(false);
  });
});

describe('Sitemap & Robots (U14)', () => {
  it('robots.txt disallows admin and api and includes sitemap link', async () => {
    const { default: robots } = await import('@/app/robots');
    const result = robots();

    expect(result.sitemap).toContain('sitemap.xml');
    const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    expect(rules.disallow).toContain('/admin');
    expect(rules.disallow).toContain('/api');
  });

  it('sitemap.xml includes core public routes with valid priorities', async () => {
    const { default: sitemap } = await import('@/app/sitemap');
    const result = await sitemap();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(10);

    const urls = result.map((r) => r.url);
    expect(urls.some((u) => u.endsWith('/shop'))).toBe(true);
    expect(urls.some((u) => u.endsWith('/how-to-order'))).toBe(true);
    expect(urls.some((u) => u.endsWith('/verify-accounts'))).toBe(true);
    expect(urls.some((u) => u.endsWith('/warranty'))).toBe(true);
    expect(urls.some((u) => u.endsWith('/privacy'))).toBe(true);
  });
});

