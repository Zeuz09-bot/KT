/**
 * Shared Listing Page Component
 * Used by /shop, /category/[slug], /brand/[slug], /deals, /new-arrivals, /best-sellers
 */
import { Suspense } from 'react';
import { ProductGrid } from './product-grid';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton } from '@/components/ui/skeleton';
import type { ProductCardView } from '@/modules/catalog';

interface ListingPageProps {
  title: string;
  subtitle?: string;
  products: ProductCardView[];
  totalCount: number;
  showSaleBadge?: boolean;
}

export function ListingPage({
  title,
  subtitle,
  products,
  totalCount,
  showSaleBadge = false,
}: ListingPageProps) {
  return (
    <div className="container mx-auto px-4 py-12">
      <SectionHeader title={title} subtitle={subtitle} />

      {totalCount === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No products found</p>
        </div>
      ) : (
        <Suspense fallback={<ProductGridSkeleton />}>
          <ProductGrid products={products} showSaleBadge={showSaleBadge} />
        </Suspense>
      )}
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}
