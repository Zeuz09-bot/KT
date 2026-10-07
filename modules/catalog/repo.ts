/**
 * Catalogue Data Repository
 * Queries published products, variants, brands, and categories via Supabase.
 */
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

export type ProductCardView = Database['public']['Views']['v_product_cards']['Row'];
export type ProductVariantPublic = Database['public']['Views']['v_product_variants_public']['Row'];

export interface ProductDetail {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  specs: Record<string, string>;
  badge: 'new' | 'best_seller' | 'hot' | 'limited' | null;
  brand: {
    id: string;
    name: string;
    slug: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  variants: ProductVariantPublic[];
  images: {
    id: string;
    path: string;
    alt: string;
    isPrimary: boolean;
    sortOrder: number;
    color: string | null;
  }[];
}

export async function listProductCards(
  supabase: SupabaseClient<Database>,
  options: {
    brandSlug?: string;
    categorySlug?: string;
    isFeatured?: boolean;
    limit?: number;
    offset?: number;
  } = {},
): Promise<ProductCardView[]> {
  let query = supabase
    .from('v_product_cards')
    .select('*')
    .order('published_at', { ascending: false });

  if (options.brandSlug) {
    query = query.eq('brand_slug', options.brandSlug);
  }
  if (options.categorySlug) {
    query = query.eq('category_slug', options.categorySlug);
  }
  if (options.isFeatured !== undefined) {
    query = query.eq('is_featured', options.isFeatured);
  }
  if (options.limit) {
    const from = options.offset ?? 0;
    query = query.range(from, from + options.limit - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getProductBySlug(
  supabase: SupabaseClient<Database>,
  slug: string,
): Promise<ProductDetail | null> {
  const { data: product, error: pError } = await supabase
    .from('products')
    .select(`
      id, slug, name, short_description, description, specs, badge, status,
      brands ( id, name, slug ),
      categories ( id, name, slug )
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (pError || !product) return null;

  const [variantsRes, imagesRes] = await Promise.all([
    supabase
      .from('v_product_variants_public')
      .select('*')
      .eq('product_id', product.id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('product_images')
      .select('id, path, alt, is_primary, sort_order, color')
      .eq('product_id', product.id)
      .order('sort_order', { ascending: true }),
  ]);

  const brand = Array.isArray(product.brands) ? product.brands[0] : product.brands;
  const category = Array.isArray(product.categories) ? product.categories[0] : product.categories;

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    shortDescription: product.short_description,
    description: product.description,
    specs: (product.specs as Record<string, string>) ?? {},
    badge: product.badge,
    brand: brand ?? { id: '', name: '', slug: '' },
    category: category ?? { id: '', name: '', slug: '' },
    variants: variantsRes.data ?? [],
    images: (imagesRes.data ?? []).map((img) => ({
      id: img.id,
      path: img.path,
      alt: img.alt,
      isPrimary: img.is_primary,
      sortOrder: img.sort_order,
      color: img.color,
    })),
  };
}

export async function listBrands(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from('brands')
    .select('id, name, slug, logo_path, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function listCategories(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, parent_id, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data ?? [];
}
