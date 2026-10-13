/**
 * Product Detail Page
 */
import { createClient } from '@/lib/supabase/server';
import { getProductBySlug, getRelatedProducts } from '@/modules/catalog';
import { ProductGallery } from '@/components/storefront/product-gallery';
import { SpecChips } from '@/components/storefront/spec-chips';
import { Badge } from '@/components/ui/badge';
import { ProductPurchaseBox } from '@/components/storefront/product-purchase-box';
import { notFound } from 'next/navigation';
import { resolveVariant } from '@/lib/contracts/catalog';

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

          {/* Purchase Box: Variant selector, live price, Add to List, Order on WhatsApp, Wishlist */}
          <ProductPurchaseBox
            productId={product.id}
            productName={product.name}
            variants={product.variants}
            initialVariant={defaultVariant}
          />

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
