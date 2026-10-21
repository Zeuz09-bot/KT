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
    <div className="min-h-screen bg-brand-cream text-brand-charcoal selection:bg-brand-navy selection:text-brand-white">
      <AnnouncementBar />
      <Navbar />
      <main>
        {/* Hero Carousel */}
        {homeData.banners.length > 0 ? (
          <HeroCarousel banners={homeData.banners} />
        ) : (
          <div className="h-[420px] bg-brand-charcoal flex flex-col items-center justify-center text-center p-6 border-b border-brand-silver/20">
            <span className="text-xs font-editorial uppercase tracking-editorial text-brand-champagne mb-2">Excellence & Authenticity</span>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-brand-white tracking-display">Keraunous Tech Store</h1>
            <p className="mt-2 text-sm text-brand-silver/80 max-w-md">Nigeria&apos;s premier quiet tech luxury showcase. Verified genuine gadgets with WhatsApp concierge.</p>
          </div>
        )}

        {/* Trust Bar */}
        {homeData.trustBar && <TrustBar items={homeData.trustBar} />}

        {/* Popular Smartphones — 30-40% Breathing Room */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <SectionHeader
            title="Popular Smartphones"
            subtitle="Curated, hand-tested devices from Apple, Samsung, and Google"
            viewAllHref="/shop"
            viewAllLabel="Explore Collection"
          />
          <div className="mt-8">
            <Suspense fallback={<ProductGridSkeleton />}>
              <ProductGrid products={homeData.popularSmartphones} />
            </Suspense>
          </div>
        </section>

        {/* Limited Time Offer / Flash Sale — 30% Grounding Tone with Champagne Foil */}
        {homeData.campaign && (
          <section className="bg-brand-navy text-brand-white py-16 md:py-20 border-y border-brand-silver/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#D4D8DD_1px,transparent_1px)] [background-size:28px_28px] opacity-10 pointer-events-none" />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-brand-silver/30 pb-4 mb-8">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-brand-champagne/20 border border-brand-champagne/40 px-3 py-0.5 text-xs font-editorial uppercase tracking-editorial text-brand-champagne mb-2">
                    Exclusive Campaign
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-display font-bold text-brand-white tracking-display">
                    {homeData.campaign.title}
                  </h2>
                  {homeData.campaign.subtitle && (
                    <p className="mt-1 text-sm text-brand-silver/80">{homeData.campaign.subtitle}</p>
                  )}
                </div>
              </div>
              <Suspense fallback={<ProductGridSkeleton />}>
                <ProductGrid products={homeData.bestDeals} showSaleBadge />
              </Suspense>
            </div>
          </section>
        )}

        {/* Shop by Brand */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <SectionHeader
            title="Curated Brands"
            subtitle="Authorised hardware & verified flagship collections"
            editorial
          />
          <div className="mt-8">
            <BrandTiles brands={homeData.brands} />
          </div>
        </section>

        {/* Best Deals */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <SectionHeader
            title="Refined Values"
            subtitle="Exceptional price-to-performance on open-box and mint condition devices"
            viewAllHref="/deals"
            viewAllLabel="View All Deals"
          />
          <div className="mt-8">
            <Suspense fallback={<ProductGridSkeleton />}>
              <ProductGrid products={homeData.bestDeals} showSaleBadge />
            </Suspense>
          </div>
        </section>

        {/* Featured Products */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <SectionHeader
            title="Featured Gadgets"
            subtitle="Flagship MacBooks, iPads, and audio gear"
            viewAllHref="/best-sellers"
            viewAllLabel="Explore All"
          />
          <div className="mt-8">
            <Suspense fallback={<ProductGridSkeleton />}>
              <ProductGrid products={homeData.featuredProducts} />
            </Suspense>
          </div>
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
