'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/lib/analytics/tracker';

interface ProductViewTrackerProps {
  productId: string;
  productName: string;
  brand: string;
  minPriceNgn: number;
}

export function ProductViewTracker({
  productId,
  productName,
  brand,
  minPriceNgn,
}: ProductViewTrackerProps) {
  useEffect(() => {
    trackEvent('view_product', {
      productId,
      productName,
      brand,
      minPriceNgn,
    });
  }, [productId, productName, brand, minPriceNgn]);

  return null;
}
