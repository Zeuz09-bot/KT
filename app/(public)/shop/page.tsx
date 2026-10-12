/**
 * Shop Page — All products listing with search, sort, and filters (U08).
 * URL params are the single source of truth; all filter pages are noindex
 * except clean category/brand URLs.
 */
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getListing, listBrands, listCategories, type ListingOptions } from '@/modules/catalog';
import { FilterSidebar, FilterBottomSheet, type FilterConfig } from '@/components/storefront/filter-panel';
import { ProductGrid } from '@/components/storefront/product-grid';
import { Skeleton } from '@/components/ui/skeleton';
import { PaginationNav } from '@/components/storefront/pagination-nav';

// noindex when any filter is active
export async function generateMetadata({ searchParams }: ShopPageProps): Promise<Metadata> {
  const params = await searchParams;
  const paramRecord = params as Record<string, string | undefined>;
  const hasFilter = ['brand', 'category', 'storage', 'condition', 'in_stock', 'on_sale', 'search']
    .some((k) => paramRecord[k]);
  return {
    title: params.search
      ? `Search: "${params.search}" — Keraunous Tech Store`
      : 'Shop Phones & Accessories — Keraunous Tech Store',
    description: 'Browse the latest phones, accessories and gadgets at the best prices in Nigeria.',
    robots: hasFilter ? { index: false, follow: true } : undefined,
  };
}

interface ShopPageProps {
  searchParams: Promise<{
    page?: string;
    sort?: string;
    brand?: string;
    category?: string;
    storage?: string;
    condition?: string;
    in_stock?: string;
    on_sale?: string;
    search?: string;
  }>;
}

const PAGE_SIZE = 24;

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const p = await searchParams;
  const supabase = await createClient();
  const page = Math.max(1, parseInt(p.page ?? '1', 10));

  // Build listing options
  const options: ListingOptions = {
    page,
    limit: PAGE_SIZE,
    sort: (p.sort as ListingOptions['sort']) || 'newest',
    brandSlug: p.brand,
    categorySlug: p.category,
    condition: p.condition as ListingOptions['condition'],
    onSale: p.on_sale === '1',
    search: p.search,
  };

  // Fetch listing + filter config data in parallel
  const [listing, brands, categories] = await Promise.all([
    getListing(supabase, options),
    listBrands(supabase),
    listCategories(supabase),
  ]);

  const filterConfig: FilterConfig = {
    brands: brands.map((b) => ({ value: b.slug, label: b.name })),
    categories: categories.map((c) => ({ value: c.slug, label: c.name })),
    storages: ['64', '128', '256', '512', '1024'].map((s) => ({
      value: s,
      label: `${s} GB`,
    })),
    conditions: [
      { value: 'brand_new', label: 'Brand New' },
      { value: 'uk_used', label: 'UK Used' },
    ],
  };

  const heading = p.search
    ? `Search: "${p.search}"`
    : 'All Products';

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6">
      {/* Page title + mobile filter trigger */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{heading}</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            {listing.totalCount === 0
              ? 'No products found'
              : `${listing.totalCount.toLocaleString()} product${listing.totalCount !== 1 ? 's' : ''}`}
          </p>
        </div>
        {/* Mobile filter bottom sheet trigger */}
        <Suspense fallback={null}>
          <FilterBottomSheet config={filterConfig} />
        </Suspense>
      </div>

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <Suspense fallback={null}>
          <FilterSidebar config={filterConfig} />
        </Suspense>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {listing.totalCount === 0 ? (
            <EmptyState hasFilters={(Object.values(p) as Array<string | undefined>).some(Boolean)} />
          ) : (
            <>
              <Suspense fallback={<ProductGridSkeleton />}>
                <ProductGrid products={listing.products} />
              </Suspense>

              {listing.totalPages > 1 && (
                <div className="mt-10 flex justify-center">
                  <PaginationNav
                    currentPage={page}
                    totalPages={listing.totalPages}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="py-20 text-center">
      <p className="text-lg font-semibold text-neutral-700">No products found</p>
      <p className="mt-1 text-sm text-neutral-500">
        {hasFilters
          ? 'Try adjusting or clearing your filters.'
          : 'Check back soon — new stock is added regularly.'}
      </p>
      {hasFilters && (
        <a
          href="/shop"
          className="mt-4 inline-block text-sm font-medium text-brand-blue hover:underline"
        >
          Clear all filters
        </a>
      )}
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}
