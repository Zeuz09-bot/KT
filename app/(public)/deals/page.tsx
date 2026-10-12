/**
 * Deals Page - Products on sale
 */
import { createClient } from '@/lib/supabase/server';
import { getListing } from '@/modules/catalog';
import { ListingPage } from '@/components/storefront/listing-page';

interface DealsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function DealsPage({ searchParams }: DealsPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const page = parseInt(params.page || '1', 10);

  const listing = await getListing(supabase, {
    onSale: true,
    page,
  });

  return (
    <ListingPage
      title="Best Deals"
      subtitle="Great prices on selected items"
      products={listing.products}
      totalCount={listing.totalCount}
      showSaleBadge
    />
  );
}
