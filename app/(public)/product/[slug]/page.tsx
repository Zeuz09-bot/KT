/**
 * Product Detail Page
 */
import { createClient } from '@/lib/supabase/server';
import { getProductBySlug, getRelatedProducts } from '@/modules/catalog';
import { ProductGallery } from '@/components/storefront/product-gallery';
import { SpecChips } from '@/components/storefront/spec-chips';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare } from 'lucide-react';
import { notFound } from 'next/navigation';
import { resolveVariant, formatWarranty } from '@/lib/contracts/catalog';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const product = await getProductBySlug(supabase, slug);
  if (!product) notFound();

  const relatedProducts = await getRelatedProducts(
    supabase,
    product.id,
    product.brand.slug,
    product.category.slug,
  );

  // Get default variant (cheapest in stock)
  const defaultVariant = resolveVariant(product.variants, {});
  const price = defaultVariant?.sale_price_ngn ?? defaultVariant?.price_ngn ?? 0;
  const oldPrice = defaultVariant?.sale_price_ngn ? defaultVariant?.price_ngn : defaultVariant?.compare_at_price_ngn;
  const stock = defaultVariant?.stock_qty ?? 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Gallery */}
        <ProductGallery images={product.images} name={product.name} />

        {/* Details */}
        <div className="space-y-6">
          {/* Breadcrumb - simplified for now */}
          <div className="text-sm text-muted-foreground">
            <span>{product.brand.name}</span> / <span>{product.category.name}</span>
          </div>

          {/* Title and Badge */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{product.name}</h1>
            {product.badge && (
              <Badge variant={product.badge === 'new' ? 'new' : 'bestseller'} className="mt-2">
                {product.badge === 'new' ? 'New' : product.badge === 'best_seller' ? 'Best Seller' : product.badge}
              </Badge>
            )}
          </div>

          {/* Short Description */}
          {product.shortDescription && (
            <p className="text-muted-foreground">{product.shortDescription}</p>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">
              ₦{price?.toLocaleString()}
            </span>
            {oldPrice && oldPrice > price && (
              <span className="text-lg text-muted-foreground line-through">
                ₦{oldPrice.toLocaleString()}
              </span>
            )}
          </div>

          {/* Stock */}
          {stock > 0 ? (
            <p className="text-sm text-green-600">
              In stock ({stock} available)
            </p>
          ) : (
            <p className="text-sm text-red-600">Out of stock</p>
          )}

          {/* Warranty */}
          {defaultVariant && (
            <p className="text-xs text-muted-foreground">
              {formatWarranty(defaultVariant.condition, defaultVariant.warranty_months)}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button size="lg" variant="whatsapp" className="flex-1" disabled={stock === 0}>
              Order on WhatsApp
            </Button>
            <Button size="lg" variant="secondary">
              <Heart className="h-5 w-5 mr-2" />
              Add to List
            </Button>
            <Button size="lg" variant="icon">
              <MessageSquare className="h-5 w-5" />
            </Button>
          </div>

          {/* Spec Chips */}
          <SpecChips specs={product.specs} />

          {/* Description */}
          {product.description && (
            <div className="prose prose-sm max-w-none">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p>{product.description}</p>
            </div>
          )}

          {/* What's in the box */}
          {product.specs?.in_the_box && (
            <div>
              <h3 className="text-lg font-semibold mb-2">What&apos;s in the box</h3>
              <p className="text-muted-foreground">{product.specs.in_the_box}</p>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4">Related Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.map((p) => (
              <div key={p.id} className="border rounded-lg p-4">
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-muted-foreground">₦{p.price_from_ngn.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
