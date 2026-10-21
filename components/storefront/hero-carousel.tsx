/**
 * Hero Carousel
 * Displays hero banners with auto-rotation and manual navigation.
 */
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Banner {
  id: string;
  type: 'hero' | 'promo';
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  cta_label: string | null;
  cta_link: string | null;
  image_path: string | null;
  linked_product_id: string | null;
  is_active: boolean;
  sort_order: number;
}

interface HeroCarouselProps {
  banners: Banner[];
}

export function HeroCarousel({ banners }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  if (banners.length === 0) return null;

  const banner = banners[currentIndex];

  return (
    <section className="relative h-[420px] md:h-[520px] overflow-hidden bg-brand-charcoal border-b border-brand-silver/20">
      {/* Banner Image / Texture */}
      {banner.image_path ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${banner.image_path})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-brand-charcoal/90 via-brand-navy/60 to-transparent" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-brand-navy via-brand-charcoal to-[#121315]">
          <div className="absolute inset-0 bg-[radial-gradient(#D4D8DD_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />
        </div>
      )}

      {/* Content — 60-30-10 Quiet Luxury */}
      <div className="relative h-full container mx-auto px-6 md:px-12 flex items-center">
        <div className="max-w-2xl text-brand-white space-y-4">
          {banner.eyebrow && (
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-champagne/15 border border-brand-champagne/30 px-3 py-1">
              <span className="text-xs font-editorial uppercase tracking-editorial text-brand-champagne">
                {banner.eyebrow}
              </span>
            </div>
          )}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold text-brand-white tracking-display leading-tight">
            {banner.title}
          </h1>
          {banner.subtitle && (
            <p className="text-sm md:text-base text-brand-silver/90 max-w-xl font-sans leading-relaxed">
              {banner.subtitle}
            </p>
          )}
          {banner.cta_label && banner.cta_link && (
            <div className="pt-2">
              <Button asChild size="lg" className="bg-brand-white text-brand-charcoal hover:bg-brand-cream border border-brand-silver/50 font-display font-semibold tracking-wide shadow-card">
                <Link href={banner.cta_link}>{banner.cta_label}</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      {banners.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Previous banner"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-brand-charcoal/60 backdrop-blur-sm border border-brand-silver/30 hover:bg-brand-charcoal/80 text-brand-white"
            onClick={() => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Next banner"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-brand-charcoal/60 backdrop-blur-sm border border-brand-silver/30 hover:bg-brand-charcoal/80 text-brand-white"
            onClick={() => setCurrentIndex((prev) => (prev + 1) % banners.length)}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          {/* Dots */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIndex ? 'w-8 bg-brand-champagne' : 'w-2 bg-brand-silver/50'
                }`}
                onClick={() => setCurrentIndex(i)}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
