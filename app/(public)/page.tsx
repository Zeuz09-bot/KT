/**
 * Home Page
 * Main storefront landing page with hero, featured products, deals, brands.
 */
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { getHomeData } from '@/modules/catalog';
import { AnnouncementBar } from '@/components/storefront/announcement-bar';
import { Navbar } from '@/components/storefront/navbar';
import { HeroCarousel } from '@/components/storefront/hero-carousel';
import { TrustBar } from '@/components/storefront/trust-bar';
import { ProductGrid } from '@/components/storefront/product-grid';
import { BrandTiles } from '@/components/storefront/brand-tiles';
import { SectionHeader } from '@/components/ui/section-header';
import { Footer } from '@/components/storefront/footer';
import { FloatingWhatsAppButton } from '@/components/storefront/floating-whatsapp-button';
import { Skeleton } from '@/components/ui/skeleton';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function HomePage() {
  const supabase = await createClient();
  const homeData = await getHomeData(supabase);

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      <Navbar />
      <main>
        {/* Hero Carousel */}
        {homeData.banners.length > 0 ? (
          <HeroCarousel banners={homeData.banners} />
        ) : (
          <div className="h-[400px] bg-muted flex items-center justify-center">
            <p className="text-muted-foreground">No active banners</p>
          </div>
        )}

        {/* Trust Bar */}
        {homeData.trustBar && <TrustBar items={homeData.trustBar} />}

        {/* Popular Smartphones */}
        <section className="container mx-auto px-4 py-12">
          <SectionHeader
            title="Popular Smartphones"
            subtitle="Best-selling devices from top brands"
            viewAllHref="/shop"
            viewAllLabel="View All"
          />
          <Suspense fallback={<ProductGridSkeleton />}>
            <ProductGrid products={homeData.popularSmartphones} />
          </Suspense>
        </section>

        {/* Limited Time Offer / Flash Sale */}
        {homeData.campaign && (
          <section className="bg-primary/5 py-12">
            <div className="container mx-auto px-4">
              <SectionHeader
                title={homeData.campaign.title}
                subtitle={homeData.campaign.subtitle}
              />
              <Suspense fallback={<ProductGridSkeleton />}>
                <ProductGrid products={homeData.bestDeals} showSaleBadge />
              </Suspense>
            </div>
          </section>
        )}

        {/* Shop by Brand */}
        <section className="container mx-auto px-4 py-12">
          <SectionHeader title="Shop by Brand" />
          <BrandTiles brands={homeData.brands} />
        </section>

        {/* Best Deals */}
        <section className="container mx-auto px-4 py-12">
          <SectionHeader
            title="Best Deals"
            subtitle="Great prices on selected items"
            viewAllHref="/deals"
            viewAllLabel="View All Deals"
          />
          <Suspense fallback={<ProductGridSkeleton />}>
            <ProductGrid products={homeData.bestDeals} showSaleBadge />
          </Suspense>
        </section>

        {/* Featured Products */}
        <section className="container mx-auto px-4 py-12">
          <SectionHeader
            title="Featured Products"
            viewAllHref="/best-sellers"
            viewAllLabel="View All"
          />
          <Suspense fallback={<ProductGridSkeleton />}>
            <ProductGrid products={homeData.featuredProducts} />
          </Suspense>
        </section>
      </main>

      <Footer />
      <FloatingWhatsAppButton />
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}
