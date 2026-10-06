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

export interface ProductCardProps {
  slug: string;
  name: string;
  imageUrl: string;
  imageAlt: string;
  priceNgn: number;
  oldPriceNgn?: number;
  stock: number;
  badge?: 'new' | 'bestseller';
  isWishlisted?: boolean;
  onWishlistToggle?: (slug: string) => void;
  /** Pre-built wa.me URL — set by the server, never from client input */
  whatsappUrl?: string;
  className?: string;
}

export function ProductCard({
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
  const isSoldOut = stock <= 0;

  return (
    <article
      className={cn(
        'group relative flex flex-col rounded-card-md border border-neutral-200 bg-neutral-0 overflow-hidden',
        'transition-shadow duration-200 hover:shadow-card-hover',
        className,
      )}
    >
      {/* Image */}
      <Link href={`/product/${slug}`} className="relative block aspect-square overflow-hidden bg-neutral-50">
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          className={cn(
            'object-cover transition-transform duration-300 group-hover:scale-105',
            isSoldOut && 'opacity-60',
          )}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
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
          aria-label={isWishlisted ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
          aria-pressed={isWishlisted}
          onClick={(e) => {
            e.preventDefault();
            onWishlistToggle?.(slug);
          }}
          className={cn(
            'absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-neutral-0/80 backdrop-blur-sm',
            'transition-colors hover:bg-neutral-0 focus-visible:outline-2 focus-visible:outline-brand-blue',
          )}
        >
          <Heart
            size={18}
            aria-hidden="true"
            className={cn(
              'transition-colors',
              isWishlisted ? 'fill-brand-danger text-brand-danger' : 'text-neutral-400',
            )}
          />
        </button>
      </Link>

      {/* Details */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link
          href={`/product/${slug}`}
          className="text-sm font-semibold text-neutral-900 line-clamp-2 hover:text-brand-blue transition-colors"
        >
          {name}
        </Link>

        <PriceTag currentNgn={priceNgn} oldNgn={oldPriceNgn} size="sm" />

        <div className="flex items-center justify-between gap-2 mt-auto pt-2">
          <StockBadge stock={stock} />

          {!isSoldOut && whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Order ${name} on WhatsApp`}
              className={cn(
                'inline-flex min-h-[36px] items-center justify-center rounded-card-sm bg-brand-whatsapp px-3 text-xs font-semibold text-neutral-900',
                'transition-colors hover:bg-brand-whatsappDark focus-visible:outline-2 focus-visible:outline-brand-blue',
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
