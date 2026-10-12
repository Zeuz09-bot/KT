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
    <section className="relative h-[400px] md:h-[500px] overflow-hidden bg-muted">
      {/* Banner Image */}
      {banner.image_path ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${banner.image_path})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80" />
      )}

      {/* Content */}
      <div className="relative h-full container mx-auto px-4 flex items-center">
        <div className="max-w-xl text-white space-y-4">
          {banner.eyebrow && (
            <p className="text-sm font-medium uppercase tracking-wider text-primary-foreground/80">
              {banner.eyebrow}
            </p>
          )}
          <h1 className="text-3xl md:text-5xl font-bold">{banner.title}</h1>
          {banner.subtitle && (
            <p className="text-lg md:text-xl text-primary-foreground/90">
              {banner.subtitle}
            </p>
          )}
          {banner.cta_label && banner.cta_link && (
            <Button asChild size="lg" className="mt-4">
              <Link href={banner.cta_link}>{banner.cta_label}</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Navigation */}
      {banners.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white"
            onClick={() => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white"
            onClick={() => setCurrentIndex((prev) => (prev + 1) % banners.length)}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/50'
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
