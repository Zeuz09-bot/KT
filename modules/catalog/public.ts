/**
 * Public Catalog Module (U07)
 * Functions for fetching data used by storefront pages.
 * All functions are read-only and respect RLS (published products only).
 */
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { listProductCards, getProductBySlug, listBrands, listCategories, type ProductCardView, type ProductDetail } from './repo';

export type { ProductCardView, ProductDetail };

export interface ListingOptions {
  brandSlug?: string;
  categorySlug?: string;
  isFeatured?: boolean;
  onSale?: boolean;
  newest?: boolean;
  condition?: 'brand_new' | 'uk_used' | 'open_box';
  search?: string;
  page?: number;
  limit?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc';
}

/**
 * Fetch all data needed for the home page.
 * Returns banners, featured products, popular smartphones, best deals, brands, and campaign.
 */
export async function getHomeData(supabase: SupabaseClient<Database>) {
  const [
    banners,
    featuredProducts,
    popularProducts,
    deals,
    brands,
    campaign,
    trustBar,
  ] = await Promise.all([
    // Active hero banners
    supabase
      .from('banners')
      .select('*')
      .eq('type', 'hero')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),

    // Featured products (up to 4)
    listProductCards(supabase, { isFeatured: true, limit: 4 }),

    // Popular smartphones (featured, category = smartphones, up to 4)
    // Note: We'll filter by category after fetching since category_slug filter is on the view
    listProductCards(supabase, { limit: 8 }),

    // Best deals (products with active sale, up to 4)
    // The view should include effective_price and sale info
    listProductCards(supabase, { limit: 8 }),

    // Active brands (up to 6)
    listBrands(supabase),

    // Active flash sale campaign
    supabase
      .from('campaigns')
      .select('*')
      .eq('is_active', true)
      .gt('ends_at', new Date().toISOString())
      .maybeSingle(),

    // Trust bar from site_settings
    supabase
      .from('site_settings')
      .select('trust_bar')
      .eq('id', 'default')
      .single(),
  ]);

  // Filter popular products to smartphones category if needed
  // (For now, we'll just use the first 4 from the featured list as "popular")
  const popularSmartphones = popularProducts.slice(0, 4);

  // Filter deals to only those with sale price < regular price
  const bestDeals = deals.filter((p: any) => p.on_sale).slice(0, 4);

  return {
    banners: banners.data ?? [],
    featuredProducts,
    popularSmartphones,
    bestDeals,
    brands: brands.slice(0, 6),
    campaign: campaign.data,
    trustBar: trustBar.data?.trust_bar ?? null,
  };
}

/**
 * Unified listing function for all product listing pages.
 * Used by /shop, /category/[slug], /brand/[slug], /deals, /new-arrivals, /best-sellers.
 */
export async function getListing(
  supabase: SupabaseClient<Database>,
  options: ListingOptions = {},
) {
  const page = options.page ?? 1;
  const limit = options.limit ?? 24;
  const offset = (page - 1) * limit;

  let query = supabase.from('v_product_cards').select('*', { count: 'exact' });

  // Apply filters
  if (options.brandSlug) {
    query = query.eq('brand_slug', options.brandSlug);
  }
  if (options.categorySlug) {
    query = query.eq('category_slug', options.categorySlug);
  }
  if (options.isFeatured !== undefined) {
    query = query.eq('is_featured', options.isFeatured);
  }
  if (options.onSale) {
    query = query.eq('on_sale', true);
  }
  if (options.search) {
    query = query.ilike('name', `%${options.search}%`);
  }

  // Sorting
  switch (options.sort) {
    case 'price_asc':
      query = query.order('lowest_price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('lowest_price', { ascending: false });
      break;
    case 'newest':
    default:
      query = query.order('published_at', { ascending: false });
      break;
  }

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    products: data ?? [],
    totalCount: count ?? 0,
    page,
    limit,
    totalPages: count ? Math.ceil(count / limit) : 0,
  };
}

/**
 * Get related products (same brand or category) for product detail page.
 */
export async function getRelatedProducts(
  supabase: SupabaseClient<Database>,
  productId: string,
  brandSlug: string,
  categorySlug: string,
) {
  // Get products from same brand (excluding current), up to 4
  const { data: brandProducts } = await supabase
    .from('v_product_cards')
    .select('*')
    .eq('brand_slug', brandSlug)
    .neq('id', productId)
    .limit(4);

  // If not enough, add from same category
  let related = brandProducts ?? [];
  if (related.length < 4) {
    const { data: categoryProducts } = await supabase
      .from('v_product_cards')
      .select('*')
      .eq('category_slug', categorySlug)
      .neq('id', productId)
      .limit(4 - related.length);

    if (categoryProducts) {
      related = [...related, ...categoryProducts];
    }
  }

  return related.slice(0, 4);
}
