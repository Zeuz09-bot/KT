/**
 * Variant Selector
 * Storage, colour, and condition selectors
 */
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { resolveVariant, formatWarranty } from '@/lib/contracts/catalog';
import type { StorefrontVariant } from '@/lib/contracts/catalog';

interface VariantSelectorProps {
  variants: StorefrontVariant[];
  onVariantChange: (variant: StorefrontVariant) => void;
}

export function VariantSelector({ variants, onVariantChange }: VariantSelectorProps) {
  const [selectedStorage, setSelectedStorage] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);

  // Get unique values
  const storageOptions = Array.from(new Set(variants.map(v => v.storage_gb).filter(Boolean))) as number[];
  const colorOptions = Array.from(new Set(variants.map(v => v.color).filter(Boolean))) as string[];
  const conditionOptions = Array.from(new Set(variants.map(v => v.condition)));

  // Resolve current variant
  const currentVariant = resolveVariant(variants, {
    storage_gb: selectedStorage ?? undefined,
    color: selectedColor ?? undefined,
    condition: selectedCondition as 'brand_new' | 'uk_used' | 'open_box' | undefined,
  });

  // Notify parent when variant changes
  useEffect(() => {
    if (currentVariant) {
      onVariantChange(currentVariant);
    }
  }, [currentVariant, onVariantChange]);

  const price = currentVariant?.sale_price_ngn ?? currentVariant?.price_ngn ?? 0;
  const oldPrice = currentVariant?.sale_price_ngn ? currentVariant?.price_ngn : currentVariant?.compare_at_price_ngn;
  const stock = currentVariant?.stock_qty ?? 0;

  return (
    <div className="space-y-6">
      {/* Storage */}
      {storageOptions.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Storage</h3>
          <div className="flex flex-wrap gap-2">
            {storageOptions.map((storage) => (
              <Button
                key={storage}
                variant={selectedStorage === storage ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setSelectedStorage(storage)}
              >
                {storage}GB
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Colour */}
      {colorOptions.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Colour</h3>
          <div className="flex flex-wrap gap-2">
            {colorOptions.map((color) => (
              <Button
                key={color}
                variant={selectedColor === color ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setSelectedColor(color)}
              >
                {color}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Condition */}
      {conditionOptions.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Condition</h3>
          <div className="flex flex-wrap gap-2">
            {conditionOptions.map((condition) => (
              <Button
                key={condition}
                variant={selectedCondition === condition ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setSelectedCondition(condition)}
              >
                {condition === 'brand_new' ? 'Brand New' : condition === 'uk_used' ? 'UK Used' : 'Open Box'}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Price and Stock */}
      <div className="border-t pt-4">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">
            ₦{price?.toLocaleString()}
          </span>
          {oldPrice && oldPrice > price && (
            <span className="text-sm text-muted-foreground line-through">
              ₦{oldPrice.toLocaleString()}
            </span>
          )}
        </div>

        {stock > 0 ? (
          <p className="text-sm text-green-600 mt-1">
            In stock ({stock} available)
          </p>
        ) : (
          <p className="text-sm text-red-600 mt-1">Out of stock</p>
        )}

        {currentVariant && (
          <p className="text-xs text-muted-foreground mt-2">
            {formatWarranty(currentVariant.condition, currentVariant.warranty_months)}
          </p>
        )}
      </div>
    </div>
  );
}
