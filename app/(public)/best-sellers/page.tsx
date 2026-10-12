/**
 * Best Sellers Page
 */
import { createClient } from '@/lib/supabase/server';
import { getListing } from '@/modules/catalog';
import { ListingPage } from '@/components/storefront/listing-page';

interface BestSellersPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function BestSellersPage({ searchParams }: BestSellersPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const page = parseInt(params.page || '1', 10);

  const listing = await getListing(supabase, {
    isFeatured: true,
    page,
  });

  return (
    <ListingPage
      title="Best Sellers"
      subtitle="Our most popular products"
      products={listing.products}
      totalCount={listing.totalCount}
    />
  );
}
