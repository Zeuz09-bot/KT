import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://keraunous.ng').replace(/\/$/, '');

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/api',
          '/api/',
          '/dev',
          '/dev/',
          '/*?*brand=*',
          '/*?*category=*',
          '/*?*storage=*',
          '/*?*condition=*',
          '/*?*in_stock=*',
          '/*?*on_sale=*',
          '/*?*search=*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
