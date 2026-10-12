/**
 * Shop Page - All products listing
 */
import { createClient } from '@/lib/supabase/server';
import { getListing, type ListingOptions } from '@/modules/catalog';
import { ListingPage } from '@/components/storefront/listing-page';

interface ShopPageProps {
  searchParams: Promise<{ page?: string; sort?: string; brand?: string; category?: string }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const page = parseInt(params.page || '1', 10);

  const options: ListingOptions = {
    page,
    sort: (params.sort as 'newest' | 'price_asc' | 'price_desc') || 'newest',
    brandSlug: params.brand,
    categorySlug: params.category,
  };

  const listing = await getListing(supabase, options);

  return (
    <ListingPage
      title="All Products"
      products={listing.products}
      totalCount={listing.totalCount}
    />
  );
}
