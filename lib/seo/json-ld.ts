/**
 * JSON-LD Schema.org Structured Data Generators (U14)
 * Blueprint §10 U14, §12.1
 * Non-negotiable rule: No fake aggregateRating or fabricated reviews.
 */

export interface ProductVariantForSchema {
  sku?: string;
  condition?: string;
  price_ngn: number;
  stock_qty?: number;
}

export interface ProductForSchema {
  name: string;
  slug: string;
  description?: string | null;
  shortDescription?: string | null;
  brand?: { name: string; slug?: string } | null;
  category?: { name: string; slug?: string } | null;
  images?: Array<{ path: string; is_primary?: boolean }>;
  variants?: ProductVariantForSchema[];
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

function resolveAbsoluteUrl(path: string, baseUrl: string): string {
  if (!path) return baseUrl;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl.replace(/\/$/, '')}${cleanPath}`;
}

export function buildProductJsonLd(product: ProductForSchema, baseUrl: string) {
  const productUrl = `${baseUrl.replace(/\/$/, '')}/product/${product.slug}`;
  const images = (product.images || []).map((img) => resolveAbsoluteUrl(img.path, baseUrl));

  const offers = (product.variants || []).map((v) => {
    const isNew = v.condition === 'brand_new';
    const isAvailable = (v.stock_qty ?? 1) > 0;

    return {
      '@type': 'Offer',
      priceCurrency: 'NGN',
      price: v.price_ngn,
      sku: v.sku,
      url: productUrl,
      availability: isAvailable
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: isNew
        ? 'https://schema.org/NewCondition'
        : 'https://schema.org/UsedCondition',
      seller: {
        '@type': 'Organization',
        name: 'Keraunous Tech Store',
      },
    };
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription || product.description || product.name,
    image: images.length > 0 ? images : [resolveAbsoluteUrl('/logo.png', baseUrl)],
    url: productUrl,
    brand: product.brand
      ? {
          '@type': 'Brand',
          name: product.brand.name,
        }
      : undefined,
    category: product.category?.name,
    offers: offers.length > 0 ? offers : undefined,
  };
}

export function buildLocalBusinessJsonLd(baseUrl: string) {
  const cleanBase = baseUrl.replace(/\/$/, '');

  return {
    '@context': 'https://schema.org',
    '@type': 'ElectronicsStore',
    name: 'Keraunous Tech Store',
    alternateName: 'Keraunos Tech',
    description:
      'Premier phone and gadget showcase in Nigeria. Specialising in genuine iPhones, Samsung, MacBooks, and accessories with verified WhatsApp ordering.',
    url: cleanBase,
    logo: `${cleanBase}/logo.png`,
    image: `${cleanBase}/logo.png`,
    telephone: '+2348070822409',
    priceRange: '₦₦ - ₦₦₦₦',
    currenciesAccepted: 'NGN',
    paymentAccepted: 'Bank Transfer',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Akure',
      addressRegion: 'Ondo State',
      addressCountry: 'NG',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '7.2571',
      longitude: '5.2058',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ],
        opens: '00:00',
        closes: '23:59',
      },
    ],
  };
}

export function buildBreadcrumbsJsonLd(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((crumb, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}
