/**
 * Brand Page
 */
import { createClient } from '@/lib/supabase/server';
import { getListing } from '@/modules/catalog';
import { ListingPage } from '@/components/storefront/listing-page';
import { notFound } from 'next/navigation';

interface BrandPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function BrandPage({ params, searchParams }: BrandPageProps) {
  const { slug } = await params;
  const sParams = await searchParams;
  const supabase = await createClient();
  const page = parseInt(sParams.page || '1', 10);

  const listing = await getListing(supabase, {
    brandSlug: slug,
    page,
  });

  if (listing.totalCount === 0 && page === 1) {
    notFound();
  }

  const brandName = listing.products[0]?.brand_name || slug;

  return (
    <ListingPage
      title={brandName}
      products={listing.products}
      totalCount={listing.totalCount}
    />
  );
}
