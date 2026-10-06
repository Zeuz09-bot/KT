/**
 * Carousel — accessible image/content slider using Embla.
 * - Pauses auto-play on hover and focus
 * - Stops animation entirely when prefers-reduced-motion is set
 * - Keyboard left/right arrows navigate slides
 * - ARIA: role="region", aria-label, aria-roledescription="slide" per item
 */
'use client';

import * as React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface CarouselProps {
  slides: React.ReactNode[];
  autoPlayMs?: number;
  loop?: boolean;
  className?: string;
  slideClassName?: string;
  showDots?: boolean;
  showArrows?: boolean;
  ariaLabel?: string;
}

export function Carousel({
  slides,
  autoPlayMs = 5000,
  loop = true,
  className,
  slideClassName,
  showDots = true,
  showArrows = true,
  ariaLabel = 'Image carousel',
}: CarouselProps) {
  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop });
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [scrollSnaps, setScrollSnaps] = React.useState<number[]>([]);
  const [isPaused, setIsPaused] = React.useState(false);

  // Track selected slide
  React.useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    const update = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', update);
    update();
    return () => { emblaApi.off('select', update); };
  }, [emblaApi]);

  // Auto-play (disabled on reduced-motion)
  React.useEffect(() => {
    if (!emblaApi || isPaused || prefersReducedMotion || autoPlayMs <= 0) return;
    const id = setInterval(() => emblaApi.scrollNext(), autoPlayMs);
    return () => clearInterval(id);
  }, [emblaApi, isPaused, prefersReducedMotion, autoPlayMs]);

  const prev = () => emblaApi?.scrollPrev();
  const next = () => emblaApi?.scrollNext();
  const goTo = (i: number) => emblaApi?.scrollTo(i);

  const navBtnClass =
    'absolute top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-0/80 shadow-card backdrop-blur-sm transition hover:bg-neutral-0 focus-visible:outline-2 focus-visible:outline-brand-blue';

  return (
    <section
      className={cn('relative overflow-hidden', className)}
      aria-label={ariaLabel}
      role="region"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      {/* Viewport */}
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {slides.map((slide, i) => (
            <div
              key={i}
              className={cn('min-w-0 flex-[0_0_100%]', slideClassName)}
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${i + 1} of ${slides.length}`}
            >
              {slide}
            </div>
          ))}
        </div>
      </div>

      {/* Prev / Next arrows */}
      {showArrows && (
        <>
          <button onClick={prev} aria-label="Previous slide" className={cn(navBtnClass, 'left-3')}>
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <button onClick={next} aria-label="Next slide" className={cn(navBtnClass, 'right-3')}>
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {showDots && scrollSnaps.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5" aria-hidden="true">
          {scrollSnaps.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                i === selectedIndex
                  ? 'w-5 bg-brand-blue'
                  : 'w-2 bg-neutral-0/60 hover:bg-neutral-0',
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}
