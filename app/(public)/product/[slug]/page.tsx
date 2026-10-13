/**
 * Product Detail Page (U07, U14 SEO & Sharing)
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProductBySlug, getRelatedProducts } from '@/modules/catalog';
import { ProductGallery } from '@/components/storefront/product-gallery';
import { SpecChips } from '@/components/storefront/spec-chips';
import { Badge } from '@/components/ui/badge';
import { ProductPurchaseBox } from '@/components/storefront/product-purchase-box';
import { resolveVariant } from '@/lib/contracts/catalog';
import { buildProductJsonLd, buildBreadcrumbsJsonLd } from '@/lib/seo/json-ld';
import { ProductViewTracker } from '@/components/storefront/product-view-tracker';
import { formatNgn } from '@/lib/money';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const product = await getProductBySlug(supabase, slug);

  if (!product) {
    return {
      title: 'Product Not Found | Keraunous Tech Store',
      description: 'The requested product could not be found.',
    };
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://keraunous.ng').replace(/\/$/, '');
  const canonicalUrl = `${siteUrl}/product/${product.slug}`;
  const minPrice = Math.min(...product.variants.map((v) => v.price_ngn));
  const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];
  const ogImageUrl = `${siteUrl}/api/og/product?title=${encodeURIComponent(
    product.name,
  )}&brand=${encodeURIComponent(product.brand.name)}&price=${encodeURIComponent(
    `From ${formatNgn(minPrice)}`,
  )}&image=${encodeURIComponent(primaryImage?.path || '')}`;

  const description =
    product.shortDescription ||
    `${product.name} with verified warranty in Nigeria. Available from ${formatNgn(
      minPrice,
    )}. Order directly on WhatsApp with nationwide delivery.`;

  return {
    title: `${product.name} | Keraunous Tech Store`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${product.name} — Keraunous Tech Store`,
      description,
      url: canonicalUrl,
      siteName: 'Keraunous Tech Store',
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${product.name} from Keraunous Tech Store`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} — Keraunous Tech Store`,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const product = await getProductBySlug(supabase, slug);
  if (!product) notFound();

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://keraunous.ng').replace(/\/$/, '');
  const minPrice = Math.min(...product.variants.map((v) => v.price_ngn));

  const relatedProducts = await getRelatedProducts(
    supabase,
    product.id,
    product.brand.slug,
    product.category.slug,
  );

  // Get default variant (cheapest in stock)
  const defaultVariant = resolveVariant(product.variants, {});

  // Generate structured data
  const productJsonLd = buildProductJsonLd(product, siteUrl);
  const breadcrumbJsonLd = buildBreadcrumbsJsonLd([
    { name: 'Home', url: siteUrl },
    { name: product.category.name, url: `${siteUrl}/category/${product.category.slug}` },
    { name: product.brand.name, url: `${siteUrl}/brand/${product.brand.slug}` },
    { name: product.name, url: `${siteUrl}/product/${product.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <ProductViewTracker
        productId={product.id}
        productName={product.name}
        brand={product.brand.name}
        minPriceNgn={minPrice}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Gallery */}
          <ProductGallery images={product.images} name={product.name} />

          {/* Details */}
          <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="text-sm text-muted-foreground">
              <span>{product.brand.name}</span> / <span>{product.category.name}</span>
            </div>

            {/* Title and Badge */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{product.name}</h1>
              {product.badge && (
                <Badge
                  variant={product.badge === 'new' ? 'new' : 'bestseller'}
                  className="mt-2"
                >
                  {product.badge === 'new'
                    ? 'New'
                    : product.badge === 'best_seller'
                    ? 'Best Seller'
                    : product.badge}
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
                  <p className="text-sm text-muted-foreground">
                    ₦{p.price_from_ngn.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
