/**
 * Wishlist View Component (U09)
 * Renders user's locally saved wishlist products with live server-resolved cards.
 * Blueprint §4, §9.5, §10.3
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Trash2, ArrowRight, ShoppingBag, RefreshCw } from 'lucide-react';
import { useWishlist } from '@/lib/hooks/use-wishlist';
import type { Database } from '@/lib/database.types';
import { formatNgn } from '@/lib/money';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type ProductCardRow = Database['public']['Views']['v_product_cards']['Row'];

export function WishlistView() {
  const { items, remove, clear, isHydrated, count } = useWishlist();
  const [products, setProducts] = useState<ProductCardRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolveWishlist = useCallback(async () => {
    if (items.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/wishlist/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: items }),
      });

      if (!res.ok) {
        throw new Error('Failed to resolve wishlist');
      }

      const json = await res.json();
      if (!json.ok || !json.data) {
        throw new Error(json.error?.message || 'Resolution error');
      }

      setProducts(json.data.products);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not load wishlist items';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [items]);

  useEffect(() => {
    if (isHydrated) {
      resolveWishlist();
    }
  }, [isHydrated, resolveWishlist]);

  if (!isHydrated) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 py-20">
          <RefreshCw className="h-8 w-8 animate-spin text-brand-blue" />
          <p className="text-sm text-neutral-500">Loading your saved gadgets...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
          <Heart className="h-10 w-10" />
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
          Your Wishlist is empty
        </h1>
        <p className="mt-2 text-sm text-neutral-600 sm:text-base">
          Tap the heart icon on any device to save it for later. Items stay saved on this device.
        </p>
        <div className="mt-8">
          <Button asChild size="lg" className="gap-2">
            <Link href="/shop">
              Explore Phones & Gadgets
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 border-b border-neutral-200 pb-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
            My Wishlist
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {count} {count === 1 ? 'item' : 'items'} saved on this device
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={clear}
            className="text-neutral-500 hover:text-brand-danger"
          >
            Clear Wishlist
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={resolveWishlist}
            disabled={loading}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-card-md border border-brand-danger/30 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Grid of Wishlist Items */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => {
          const isSoldOut = product.total_stock <= 0;
          return (
            <div
              key={product.id}
              className="group relative flex flex-col overflow-hidden rounded-card-md border border-neutral-200 bg-neutral-0 shadow-sm transition hover:shadow-card-hover"
            >
              {/* Product Image */}
              <Link
                href={`/product/${product.slug}`}
                className="relative block aspect-square overflow-hidden bg-neutral-50"
              >
                {product.primary_image ? (
                  <Image
                    src={product.primary_image}
                    alt={product.name}
                    fill
                    className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
                      isSoldOut ? 'opacity-60' : ''
                    }`}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-neutral-400">
                    <ShoppingBag className="h-12 w-12" />
                  </div>
                )}

                {/* Remove button */}
                <button
                  type="button"
                  aria-label={`Remove ${product.name} from wishlist`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    remove(product.id);
                  }}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-0/90 text-neutral-500 shadow-sm backdrop-blur-sm transition hover:bg-red-50 hover:text-brand-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                {/* Badges */}
                <div className="absolute left-2 top-2 flex flex-col gap-1">
                  {product.badge === 'new' && <Badge variant="new">New</Badge>}
                  {product.badge === 'best_seller' && <Badge variant="bestseller">Best Seller</Badge>}
                  {isSoldOut && <Badge variant="soldout">Sold Out</Badge>}
                </div>
              </Link>

              {/* Product Info */}
              <div className="flex flex-1 flex-col p-4">
                <span className="text-xs font-medium text-neutral-500">
                  {product.brand_name}
                </span>
                <Link
                  href={`/product/${product.slug}`}
                  className="mt-1 line-clamp-2 text-sm font-semibold text-neutral-900 group-hover:text-brand-blue"
                >
                  {product.name}
                </Link>

                <div className="mt-auto pt-3">
                  <div className="text-sm font-bold text-neutral-900">
                    From {formatNgn(product.price_from_ngn)}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Button
                      asChild
                      size="sm"
                      variant="primary"
                      className="w-full text-xs"
                      disabled={isSoldOut}
                    >
                      <Link href={`/product/${product.slug}`}>
                        {isSoldOut ? 'View Product' : 'Select Variant'}
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
