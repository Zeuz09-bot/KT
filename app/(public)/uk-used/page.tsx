/**
 * UK Used Page
 * Curated showcase of certified pre-owned UK Used iPhones, Samsungs, Pixels, and MacBooks.
 */
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getListing, type ListingOptions } from '@/modules/catalog';
import { ListingPage } from '@/components/storefront/listing-page';

interface UkUsedPageProps {
  searchParams: Promise<{ page?: string; sort?: string }>;
}

export const metadata: Metadata = {
  title: 'UK Used Phones & Gadgets in Nigeria | Keraunous Tech Store',
  description:
    'Shop authentic Grade A UK used iPhones, Samsung Galaxy, and MacBooks in Nigeria. Hand-tested battery health, warranty guaranteed, transparent integer Naira prices.',
  keywords: [
    'UK used phones Nigeria',
    'UK used iPhone',
    'UK used iPhone 15 Pro Max',
    'UK used Samsung',
    'certified pre owned phones Nigeria',
    'UK used gadgets Akure Ondo',
  ],
};

export default async function UkUsedPage({ searchParams }: UkUsedPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const page = Math.max(1, parseInt(params.page || '1', 10));

  const listing = await getListing(supabase, {
    condition: 'uk_used',
    sort: (params.sort as ListingOptions['sort']) || 'newest',
    page,
  });

  return (
    <ListingPage
      title="UK Used Collection"
      subtitle="Grade A certified pre-owned gadgets with verified battery health, original accessories, and store warranty"
      products={listing.products}
      totalCount={listing.totalCount}
    />
  );
}
