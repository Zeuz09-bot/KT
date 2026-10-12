/**
 * Product Grid
 * Displays a grid of product cards for listing pages.
 */
import { ProductCard } from './product-card';
import type { ProductCardView } from '@/modules/catalog';

interface ProductGridProps {
  products: ProductCardView[];
  showSaleBadge?: boolean;
}

export function ProductGrid({ products, showSaleBadge = false }: ProductGridProps) {
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No products found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          slug={product.slug}
          name={product.name}
          imageUrl={product.primary_image || '/placeholder-product.png'}
          imageAlt={product.name}
          priceNgn={product.price_from_ngn}
          oldPriceNgn={showSaleBadge && product.on_sale ? product.price_to_ngn : undefined}
          stock={product.total_stock}
          badge={product.badge === 'new' ? 'new' : product.badge === 'best_seller' ? 'bestseller' : undefined}
        />
      ))}
    </div>
  );
}
