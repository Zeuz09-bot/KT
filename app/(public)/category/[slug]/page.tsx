/**
 * Category Page
 */
import { createClient } from '@/lib/supabase/server';
import { getListing } from '@/modules/catalog';
import { ListingPage } from '@/components/storefront/listing-page';
import { notFound } from 'next/navigation';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const sParams = await searchParams;
  const supabase = await createClient();
  const page = parseInt(sParams.page || '1', 10);

  const listing = await getListing(supabase, {
    categorySlug: slug,
    page,
  });

  if (listing.totalCount === 0 && page === 1) {
    notFound();
  }

  const categoryName = listing.products[0]?.category_name || slug;

  return (
    <ListingPage
      title={categoryName}
      products={listing.products}
      totalCount={listing.totalCount}
    />
  );
}
