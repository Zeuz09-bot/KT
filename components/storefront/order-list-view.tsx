/**
 * Order List View Component (U09)
 * Renders customer's order list with live server-resolved prices,
 * variant details, quantity controls, out-of-stock notices, and price change banner.
 * Blueprint §9.5, §10.3
 */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Trash2,
  Plus,
  Minus,
  AlertTriangle,
  ArrowRight,
  ShoppingBag,
  RefreshCw,
  Info,
} from 'lucide-react';
import { useOrderList } from '@/lib/hooks/use-order-list';
import type { ResolvedLine } from '@/lib/contracts/list';
import { formatNgn } from '@/lib/money';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CustomerOrderForm } from '@/components/storefront/customer-order-form';

export function OrderListView() {
  const {
    items,
    setQty,
    remove,
    clear,
    isHydrated,
    count,
  } = useOrderList();

  const [resolvedLines, setResolvedLines] = useState<ResolvedLine[]>([]);
  const [subtotalNgn, setSubtotalNgn] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priceChangedNotice, setPriceChangedNotice] = useState(false);

  const prevPricesRef = useRef<Map<string, number>>(new Map());

  const resolveList = useCallback(async () => {
    if (items.length === 0) {
      setResolvedLines([]);
      setSubtotalNgn(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/list/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      if (!res.ok) {
        throw new Error('Failed to update list pricing');
      }

      const json = await res.json();
      if (!json.ok || !json.data) {
        throw new Error(json.error?.message || 'Resolution failed');
      }

      const lines: ResolvedLine[] = json.data.lines;
      const subtotal: number = json.data.subtotalNgn;

      // Check for price changes since previous resolution
      let changed = false;
      const prevPrices = prevPricesRef.current;
      if (prevPrices.size > 0) {
        for (const line of lines) {
          if (line.available && prevPrices.has(line.variantId)) {
            const oldPrice = prevPrices.get(line.variantId)!;
            if (oldPrice !== line.unitPriceNgn) {
              changed = true;
              line.priceChangedSinceAdded = true;
            }
          }
        }
      }

      // Record latest prices
      const newPrices = new Map<string, number>();
      for (const line of lines) {
        if (line.available) {
          newPrices.set(line.variantId, line.unitPriceNgn);
        }
      }
      prevPricesRef.current = newPrices;

      if (changed) {
        setPriceChangedNotice(true);
      }

      setResolvedLines(lines);
      setSubtotalNgn(subtotal);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not verify current prices';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [items]);

  // Resolve whenever items change and after hydration
  useEffect(() => {
    if (isHydrated) {
      resolveList();
    }
  }, [isHydrated, resolveList]);

  // Refetch on window focus (SWR behavior)
  useEffect(() => {
    const handleFocus = () => {
      if (isHydrated && items.length > 0) {
        resolveList();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isHydrated, items.length, resolveList]);

  if (!isHydrated) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 py-20">
          <RefreshCw className="h-8 w-8 animate-spin text-brand-blue" />
          <p className="text-sm text-neutral-500">Loading your order list...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
          <ShoppingBag className="h-10 w-10" />
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
          Your Order List is empty
        </h1>
        <p className="mt-2 text-sm text-neutral-600 sm:text-base">
          Browse our catalogue to add phones and gadgets to your order list. You can order multiple items at once on WhatsApp.
        </p>
        <div className="mt-8">
          <Button asChild size="lg" className="gap-2">
            <Link href="/shop">
              Browse Catalogue
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 border-b border-neutral-200 pb-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
            Order List
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {count} {count === 1 ? 'item' : 'items'} ready for WhatsApp order review
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={clear}
            className="text-neutral-500 hover:text-brand-danger"
          >
            Clear List
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={resolveList}
            disabled={loading}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Prices
          </Button>
        </div>
      </div>

      {/* Price changed banner */}
      {priceChangedNotice && (
        <div className="mt-6 flex items-start gap-3 rounded-card-md border border-amber-300 bg-amber-50 p-4 text-amber-900">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <div className="flex-1 text-sm">
            <strong className="font-semibold">Store prices updated:</strong> Some item prices have changed since you added them. Your list now reflects the current active prices.
          </div>
          <button
            type="button"
            onClick={() => setPriceChangedNotice(false)}
            className="text-xs font-semibold text-amber-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="mt-6 flex items-center gap-3 rounded-card-md border border-brand-danger/30 bg-red-50 p-4 text-sm text-red-800">
          <AlertTriangle className="h-5 w-5 shrink-0 text-brand-danger" />
          <p>{error}</p>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        {/* Line Items */}
        <div className="space-y-4 lg:col-span-7">
          {resolvedLines.map((line) => {
            const isUnavailable = !line.available;
            return (
              <div
                key={line.variantId}
                className={`relative flex flex-col gap-4 rounded-card-md border bg-neutral-0 p-4 transition-all sm:flex-row sm:items-center sm:gap-6 ${
                  isUnavailable
                    ? 'border-neutral-200 bg-neutral-50/70 opacity-75'
                    : 'border-neutral-200 shadow-sm'
                }`}
              >
                {/* Thumbnail */}
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-neutral-100 sm:h-24 sm:w-24">
                  {line.imageUrl ? (
                    <Image
                      src={line.imageUrl}
                      alt={line.name}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-neutral-400">
                      <ShoppingBag className="h-8 w-8" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {line.productSlug ? (
                      <Link
                        href={`/product/${line.productSlug}`}
                        className="truncate text-base font-semibold text-neutral-900 hover:text-brand-blue"
                      >
                        {line.name}
                      </Link>
                    ) : (
                      <span className="truncate text-base font-semibold text-neutral-700">
                        {line.name}
                      </span>
                    )}

                    {isUnavailable && (
                      <Badge variant="soldout" className="text-xs">
                        Out of stock
                      </Badge>
                    )}

                    {line.priceChangedSinceAdded && (
                      <Badge variant="generic" className="text-xs bg-amber-100 text-amber-800 border-amber-300">
                        Price updated
                      </Badge>
                    )}
                  </div>

                  <p className="mt-0.5 text-xs text-neutral-500">
                    {line.label}
                  </p>

                  <div className="mt-2 text-sm font-semibold text-neutral-900">
                    {isUnavailable ? (
                      <span className="text-xs font-normal text-neutral-500">
                        Unavailable
                      </span>
                    ) : (
                      formatNgn(line.unitPriceNgn)
                    )}
                  </div>
                </div>

                {/* Quantity Controls & Remove */}
                <div className="flex items-center justify-between gap-4 border-t border-neutral-100 pt-3 sm:border-0 sm:pt-0">
                  {!isUnavailable && (
                    <div className="flex items-center rounded-md border border-neutral-200 bg-neutral-50">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        disabled={line.qty <= 1}
                        onClick={() => setQty(line.variantId, line.qty - 1)}
                        className="flex h-8 w-8 items-center justify-center text-neutral-600 transition hover:bg-neutral-200 disabled:opacity-40"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-neutral-900">
                        {line.qty}
                      </span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        disabled={line.qty >= line.maxQty}
                        onClick={() => setQty(line.variantId, line.qty + 1)}
                        className="flex h-8 w-8 items-center justify-center text-neutral-600 transition hover:bg-neutral-200 disabled:opacity-40"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    aria-label={`Remove ${line.name} from list`}
                    onClick={() => remove(line.variantId)}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 transition hover:bg-red-50 hover:text-brand-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}

          <div className="pt-2">
            <Button asChild variant="ghost" size="sm" className="text-xs text-neutral-600">
              <Link href="/shop">
                + Add More Gadgets from Catalogue
              </Link>
            </Button>
          </div>
        </div>

        {/* Order Summary & Customer Form */}
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-card-md border border-neutral-200 bg-neutral-0 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-neutral-900">
              Order Summary
            </h2>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between text-neutral-600">
                <dt>Subtotal ({count} {count === 1 ? 'item' : 'items'})</dt>
                <dd className="font-semibold text-neutral-900">
                  {formatNgn(subtotalNgn)}
                </dd>
              </div>
              <div className="flex justify-between text-neutral-600">
                <dt>Delivery</dt>
                <dd className="text-xs text-neutral-500 italic">
                  Calculated on WhatsApp
                </dd>
              </div>
              <div className="border-t border-neutral-200 pt-3 flex justify-between font-bold text-base text-neutral-900">
                <dt>Estimated Total</dt>
                <dd className="text-brand-blue">{formatNgn(subtotalNgn)}</dd>
              </div>
            </dl>

            <div className="mt-4 flex items-start gap-2 rounded-md bg-blue-50/70 p-3 text-xs text-blue-900">
              <Info className="h-4 w-4 shrink-0 text-brand-blue mt-0.5" />
              <p>
                Delivery fee and final price confirmed on WhatsApp with seller before transfer.
              </p>
            </div>
          </div>

          {/* Customer checkout details form */}
          <CustomerOrderForm
            lines={resolvedLines}
            subtotalNgn={subtotalNgn}
            onPriceChanged={resolveList}
          />
        </div>
      </div>
    </div>
  );
}
