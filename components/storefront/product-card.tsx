/**
 * ProductCard — core catalogue item card.
 *
 * Blueprint §2 corrections applied:
 * - No star ratings or review counts
 * - No "Add to Cart" → "Order on WhatsApp" (primary) and heart (wishlist, local only)
 * - No fake social proof
 * - Prices in ₦ (integer Naira via PriceTag)
 */
'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PriceTag } from '@/components/ui/price-tag';
import { Badge } from '@/components/ui/badge';
import { StockBadge } from '@/components/ui/stock-badge';
import { useWishlist } from '@/lib/hooks/use-wishlist';

export interface ProductCardProps {
  id?: string;
  slug: string;
  name: string;
  imageUrl: string;
  imageAlt: string;
  priceNgn: number;
  oldPriceNgn?: number;
  stock: number;
  badge?: 'new' | 'bestseller';
  isWishlisted?: boolean;
  onWishlistToggle?: (idOrSlug: string) => void;
  /** Pre-built wa.me URL — set by the server, never from client input */
  whatsappUrl?: string;
  className?: string;
}

export function ProductCard({
  id,
  slug,
  name,
  imageUrl,
  imageAlt,
  priceNgn,
  oldPriceNgn,
  stock,
  badge,
  isWishlisted = false,
  onWishlistToggle,
  whatsappUrl,
  className,
}: ProductCardProps) {
  const { has, toggle } = useWishlist();
  const isSoldOut = stock <= 0;
  const isSaved = onWishlistToggle ? isWishlisted : (id ? has(id) : has(slug));

  return (
    <article
      className={cn(
        'group relative flex flex-col rounded-card-md border border-brand-silver/50 bg-brand-white overflow-hidden',
        'transition-all duration-300 hover:shadow-card-hover hover:border-brand-navy/30',
        className,
      )}
    >
      {/* Image with boutique breathing room */}
      <Link href={`/product/${slug}`} className="relative block aspect-square overflow-hidden bg-brand-cream/40 p-4">
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          className={cn(
            'object-contain p-3 transition-transform duration-500 group-hover:scale-105',
            isSoldOut && 'opacity-50 grayscale',
          )}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* Badges */}
        <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5 z-10">
          {badge === 'new' && <Badge variant="new">New</Badge>}
          {badge === 'bestseller' && <Badge variant="bestseller">Best Seller</Badge>}
          {oldPriceNgn && oldPriceNgn > priceNgn && (
            <Badge variant="discount">
              -{Math.round(((oldPriceNgn - priceNgn) / oldPriceNgn) * 100)}%
            </Badge>
          )}
        </div>

        {/* Wishlist heart */}
        <button
          type="button"
          aria-label={isSaved ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
          aria-pressed={isSaved}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onWishlistToggle) {
              onWishlistToggle(id ?? slug);
            } else {
              toggle(id ?? slug);
            }
          }}
          className={cn(
            'absolute right-2.5 top-2.5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-brand-white/90 backdrop-blur-sm border border-brand-silver/40 shadow-sm',
            'transition-colors hover:bg-brand-white focus-visible:outline-2 focus-visible:outline-brand-navy',
          )}
        >
          <Heart
            size={17}
            aria-hidden="true"
            className={cn(
              'transition-colors',
              isSaved ? 'fill-brand-danger text-brand-danger' : 'text-brand-charcoal/40 group-hover:text-brand-charcoal/70',
            )}
          />
        </button>
      </Link>

      {/* Details */}
      <div className="flex flex-1 flex-col gap-2 p-3.5 bg-brand-white">
        <Link
          href={`/product/${slug}`}
          className="text-sm font-display font-medium text-brand-charcoal line-clamp-2 hover:text-brand-navy transition-colors tracking-display"
        >
          {name}
        </Link>

        <PriceTag currentNgn={priceNgn} oldNgn={oldPriceNgn} size="sm" />

        <div className="flex items-center justify-between gap-2 mt-auto pt-2.5 border-t border-brand-silver/20">
          <StockBadge stock={stock} />

          {!isSoldOut && whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Order ${name} on WhatsApp`}
              className={cn(
                'inline-flex min-h-[36px] items-center justify-center rounded-card-sm bg-brand-whatsapp px-3.5 text-xs font-semibold text-brand-charcoal shadow-sm',
                'transition-all hover:bg-brand-whatsappDark focus-visible:outline-2 focus-visible:outline-brand-navy',
              )}
            >
              Order
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
