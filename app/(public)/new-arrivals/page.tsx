/**
 * New Arrivals Page
 */
import { createClient } from '@/lib/supabase/server';
import { getListing } from '@/modules/catalog';
import { ListingPage } from '@/components/storefront/listing-page';

interface NewArrivalsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function NewArrivalsPage({ searchParams }: NewArrivalsPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const page = parseInt(params.page || '1', 10);

  const listing = await getListing(supabase, {
    sort: 'newest',
    page,
  });

  return (
    <ListingPage
      title="New Arrivals"
      subtitle="Fresh products just in"
      products={listing.products}
      totalCount={listing.totalCount}
    />
  );
}
