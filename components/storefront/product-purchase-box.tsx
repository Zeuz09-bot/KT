/**
 * Product Purchase Box Component (U09)
 * Manages variant selection, live price/stock rendering,
 * "Add to List" with toast confirmation, and wishlist toggling.
 * Blueprint §2 (#10), §9.5, §10.3
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VariantSelector } from '@/components/storefront/variant-selector';
import { QuickOrderSheet } from '@/components/storefront/quick-order-sheet';
import { useOrderList } from '@/lib/hooks/use-order-list';
import { useWishlist } from '@/lib/hooks/use-wishlist';
import { useToast } from '@/components/ui/toast';
import { formatNgn } from '@/lib/money';
import { formatWarranty, type StorefrontVariant } from '@/lib/contracts/catalog';
import { trackEvent } from '@/lib/analytics/tracker';

interface ProductPurchaseBoxProps {
  productId: string;
  productName: string;
  variants: StorefrontVariant[];
  initialVariant: StorefrontVariant | null;
  whatsappNumber?: string;
}

export function ProductPurchaseBox({
  productId,
  productName,
  variants,
  initialVariant,
  whatsappNumber = '2348070822409',
}: ProductPurchaseBoxProps) {
  const [selectedVariant, setSelectedVariant] = useState<StorefrontVariant | null>(initialVariant);
  const [showQuickOrder, setShowQuickOrder] = useState(false);
  const { add: addToList, isFull } = useOrderList();
  const { has: isWishlisted, toggle: toggleWishlist } = useWishlist();
  const { toast } = useToast();

  const variant = selectedVariant ?? initialVariant;
  const price = variant?.sale_price_ngn ?? variant?.price_ngn ?? 0;
  const oldPrice = variant?.sale_price_ngn ? variant?.price_ngn : variant?.compare_at_price_ngn;
  const stock = variant?.stock_qty ?? 0;
  const isSoldOut = stock <= 0;
  const isSaved = isWishlisted(productId);

  const handleAddToList = () => {
    if (!variant) return;

    if (isFull) {
      toast({
        title: 'Order List Full',
        description: 'You have reached the maximum of 10 items in your order list.',
        variant: 'error',
      });
      return;
    }

    addToList(variant.id);
    trackEvent('add_to_list', {
      productId,
      variantId: variant.id,
      priceNgn: variant.price_ngn,
    });
    toast({
      title: 'Added to Order List',
      description: `${productName} added to your order list.`,
      variant: 'success',
    });
  };

  const handleToggleWishlist = () => {
    const isNowSaved = toggleWishlist(productId);
    if (isNowSaved) {
      trackEvent('wishlist_add', { productId, productName });
    }
    toast({
      title: isNowSaved ? 'Saved to Wishlist' : 'Removed from Wishlist',
      description: isNowSaved
        ? `${productName} saved on this device.`
        : `${productName} removed from saved items.`,
      variant: 'info',
    });
  };

  // Plain WhatsApp inquiry URL (Blueprint §9.4 rule: "Hi, I'm interested in {product name} {url}")
  const waInquiryUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `Hi Keraunous, I'm interested in ${productName}${variant?.storage_gb ? ` (${variant.storage_gb}GB` : ''}${variant?.color ? `, ${variant.color})` : ')'}`,
  )}`;

  return (
    <div className="space-y-6">
      {/* Variant Selector */}
      {variants.length > 0 && (
        <VariantSelector
          variants={variants}
          onVariantChange={setSelectedVariant}
        />
      )}

      {/* Price */}
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-extrabold text-neutral-900">
          {formatNgn(price)}
        </span>
        {oldPrice && oldPrice > price && (
          <span className="text-lg text-neutral-400 line-through">
            {formatNgn(oldPrice)}
          </span>
        )}
      </div>

      {/* Stock & Warranty */}
      <div className="flex flex-col gap-1 text-sm">
        {stock > 0 ? (
          <p className="font-medium text-emerald-600">
            In stock ({stock} available)
          </p>
        ) : (
          <p className="font-medium text-brand-danger">
            Out of stock
          </p>
        )}

        {variant && (
          <p className="text-xs text-neutral-500">
            {formatWarranty(variant.condition, variant.warranty_months)}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {/* Primary: Order on WhatsApp */}
        <Button
          type="button"
          size="lg"
          variant="whatsapp"
          onClick={() => setShowQuickOrder(true)}
          className="flex-1 min-w-[200px]"
          disabled={isSoldOut || !variant}
        >
          Order on WhatsApp
        </Button>

        {/* Secondary: Add to Order List */}
        <Button
          type="button"
          size="lg"
          variant="secondary"
          onClick={handleAddToList}
          disabled={isSoldOut || !variant}
          className="gap-2"
        >
          <ClipboardList className="h-5 w-5 text-neutral-600" />
          Add to List
        </Button>

        {/* Wishlist toggle */}
        <Button
          type="button"
          size="lg"
          variant="secondary"
          onClick={handleToggleWishlist}
          aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
          className="px-3"
        >
          <Heart
            className={`h-5 w-5 transition-colors ${
              isSaved ? 'fill-brand-danger text-brand-danger' : 'text-neutral-500'
            }`}
          />
        </Button>
      </div>

      <div className="flex items-center justify-between text-xs text-neutral-500">
        <Link href="/order-list" className="hover:text-brand-blue hover:underline">
          View your Order List &rarr;
        </Link>
        <a
          href={waInquiryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-brand-blue hover:underline"
        >
          Have questions? Ask on WhatsApp
        </a>
      </div>

      <QuickOrderSheet
        open={showQuickOrder}
        onOpenChange={setShowQuickOrder}
        productName={productName}
        variant={variant}
      />
    </div>
  );
}
