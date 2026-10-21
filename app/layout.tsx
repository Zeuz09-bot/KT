import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans, Cinzel } from 'next/font/google';
import './globals.css';
import { buildLocalBusinessJsonLd } from '@/lib/seo/json-ld';
import { UtmTracker } from '@/components/storefront/utm-tracker';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jakarta',
  weight: ['400', '500', '600', '700', '800'],
});

const cinzel = Cinzel({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-cinzel',
  weight: ['400', '500', '600', '700'],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://keraunous.ng';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Keraunous Tech Store | Premium Phones & Gadgets in Nigeria',
    template: '%s | Keraunous Tech Store',
  },
  description:
    'Browse premium smartphones, tablets, MacBooks, and gadgets in Nigeria. Authentic devices, warranty guaranteed, transparent Naira prices, and direct WhatsApp ordering.',
  keywords: [
    'phones in Nigeria',
    'buy iPhone in Nigeria',
    'UK used iPhone Ondo state',
    'Samsung phones Nigeria',
    'MacBook Nigeria',
    'gadget store Akure',
    'WhatsApp phone store',
  ],
  authors: [{ name: 'Keraunous Tech Store' }],
  creator: 'Keraunous Tech Store',
  publisher: 'Keraunous Tech Store',
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: siteUrl,
    siteName: 'Keraunous Tech Store',
    title: 'Keraunous Tech Store | Premium Phones & Gadgets in Nigeria',
    description:
      'Showcase catalogue of authentic smartphones, MacBooks, and original gadgets with verified WhatsApp checkout and nationwide delivery.',
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: 'Keraunous Tech Store — Authentic Phones & Gadgets in Nigeria',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Keraunous Tech Store | Premium Phones & Gadgets in Nigeria',
    description:
      'Showcase catalogue of authentic smartphones and gadgets with verified WhatsApp checkout.',
    images: ['/og-default.png'],
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const localBusinessSchema = buildLocalBusinessJsonLd(siteUrl);

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
      </head>
      <body className={`${inter.variable} ${jakarta.variable} ${cinzel.variable} min-h-screen bg-brand-cream text-brand-charcoal font-sans antialiased`}>
        <UtmTracker />
        {children}
      </body>
    </html>
  );
}
