import 'server-only';

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database, ProductStatus, ItemCondition } from '@/lib/database.types';
import type {
  CreateProductInput,
  UpdateProductInput,
  VariantInput,
  UpdateVariantInput,
  BrandInput,
  UpdateBrandInput,
  CategoryInput,
  UpdateCategoryInput,
  BulkPricePreviewRow,
} from '@/lib/contracts/catalog';

export type AdminProductRow = {
  id: string;
  name: string;
  slug: string;
  status: ProductStatus;
  badge: 'new' | 'best_seller' | 'hot' | 'limited' | null;
  isFeatured: boolean;
  brand: { id: string; name: string } | null;
  category: { id: string; name: string } | null;
  primaryImage: string | null;
  variantsCount: number;
  totalStock: number;
  firstVariantId: string | null;
  minPriceNgn: number;
  maxPriceNgn: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminProductDetail = {
  id: string;
  name: string;
  slug: string;
  status: ProductStatus;
  badge: 'new' | 'best_seller' | 'hot' | 'limited' | null;
  isFeatured: boolean;
  shortDescription: string | null;
  description: string | null;
  specs: Record<string, string>;
  brandId: string;
  categoryId: string;
  brand: { id: string; name: string; slug: string } | null;
  category: { id: string; name: string; slug: string } | null;
  variants: Array<Database['public']['Tables']['product_variants']['Row']>;
  images: Array<Database['public']['Tables']['product_images']['Row']>;
  createdAt: string;
  updatedAt: string;
};

/**
 * Lists products for admin with filters and aggregate variant/stock/image info.
 */
export async function adminListProducts(
  supabase: SupabaseClient<Database>,
  options: {
    search?: string;
    status?: ProductStatus;
    brandId?: string;
    categoryId?: string;
    lowStock?: boolean;
    soldOut?: boolean;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ products: AdminProductRow[]; totalCount: number }> {
  let query = supabase
    .from('products')
    .select(
      `
      id, name, slug, status, badge, is_featured, created_at, updated_at,
      brands ( id, name ),
      categories ( id, name ),
      product_variants ( id, price_ngn, stock_qty, low_stock_threshold, is_active ),
      product_images ( id, path, is_primary )
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false });

  if (options.status) {
    query = query.eq('status', options.status);
  }
  if (options.brandId) {
    query = query.eq('brand_id', options.brandId);
  }
  if (options.categoryId) {
    query = query.eq('category_id', options.categoryId);
  }
  if (options.search) {
    query = query.ilike('name', `%${options.search}%`);
  }

  const { data, count, error } = await query;
  if (error) throw error;

  let products: AdminProductRow[] = (data ?? []).map((p) => {
    const brand = Array.isArray(p.brands) ? p.brands[0] : p.brands;
    const category = Array.isArray(p.categories) ? p.categories[0] : p.categories;
    const variants = (p.product_variants ?? []) as Array<{
      id: string;
      price_ngn: number;
      stock_qty: number;
      low_stock_threshold: number;
      is_active: boolean;
    }>;
    const images = (p.product_images ?? []) as Array<{
      id: string;
      path: string;
      is_primary: boolean;
    }>;

    const primaryImage = images.find((i) => i.is_primary)?.path ?? images[0]?.path ?? null;
    const totalStock = variants.reduce((sum, v) => sum + v.stock_qty, 0);
    const prices = variants.map((v) => v.price_ngn).filter((p) => p > 0);
    const minPriceNgn = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPriceNgn = prices.length > 0 ? Math.max(...prices) : 0;

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      status: p.status,
      badge: p.badge,
      isFeatured: p.is_featured,
      brand: brand ? { id: brand.id, name: brand.name } : null,
      category: category ? { id: category.id, name: category.name } : null,
      primaryImage,
      variantsCount: variants.length,
      totalStock,
      firstVariantId: variants[0]?.id ?? null,
      minPriceNgn,
      maxPriceNgn,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    };
  });

  // Apply client-side stock filters if requested
  if (options.lowStock) {
    products = products.filter((p) => p.totalStock > 0 && p.totalStock <= 5);
  } else if (options.soldOut) {
    products = products.filter((p) => p.totalStock === 0);
  }

  const totalCount = count ?? products.length;

  if (options.limit) {
    const from = options.offset ?? 0;
    products = products.slice(from, from + options.limit);
  }

  return { products, totalCount };
}

/**
 * Gets a full product record by ID for admin viewing/editing.
 */
export async function adminGetProductById(
  supabase: SupabaseClient<Database>,
  id: string
): Promise<AdminProductDetail | null> {
  const { data: p, error: pError } = await supabase
    .from('products')
    .select(
      `
      id, name, slug, status, badge, is_featured, short_description, description, specs,
      brand_id, category_id, created_at, updated_at,
      brands ( id, name, slug ),
      categories ( id, name, slug )
    `
    )
    .eq('id', id)
    .single();

  if (pError || !p) return null;

  const [variantsRes, imagesRes] = await Promise.all([
    supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('product_images')
      .select('*')
      .eq('product_id', id)
      .order('sort_order', { ascending: true }),
  ]);

  const brand = Array.isArray(p.brands) ? p.brands[0] : p.brands;
  const category = Array.isArray(p.categories) ? p.categories[0] : p.categories;

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    status: p.status,
    badge: p.badge,
    isFeatured: p.is_featured,
    shortDescription: p.short_description,
    description: p.description,
    specs: (p.specs as Record<string, string>) ?? {},
    brandId: p.brand_id,
    categoryId: p.category_id,
    brand: brand ? { id: brand.id, name: brand.name, slug: brand.slug } : null,
    category: category ? { id: category.id, name: category.name, slug: category.slug } : null,
    variants: variantsRes.data ?? [],
    images: imagesRes.data ?? [],
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}

/**
 * Checks if a slug is available (not used by another product or redirect).
 */
export async function adminIsSlugAvailable(
  supabase: SupabaseClient<Database>,
  slug: string,
  excludeProductId?: string
): Promise<boolean> {
  let query = supabase.from('products').select('id').eq('slug', slug);
  if (excludeProductId) {
    query = query.neq('id', excludeProductId);
  }
  const { data: pData } = await query.maybeSingle();
  if (pData) return false;

  const { data: rData } = await supabase
    .from('slug_redirects')
    .select('id')
    .eq('old_slug', slug)
    .maybeSingle();

  return !rData;
}

/**
 * Creates a new product in 'draft' status.
 */
export async function adminCreateProduct(
  supabase: SupabaseClient<Database>,
  data: CreateProductInput,
  actorId?: string
): Promise<string> {
  const { data: product, error } = await supabase
    .from('products')
    .insert({
      name: data.name,
      slug: data.slug,
      brand_id: data.brandId,
      category_id: data.categoryId,
      short_description: data.shortDescription ?? null,
      description: data.description ?? null,
      badge: data.badge ?? null,
      is_featured: data.isFeatured ?? false,
      specs: data.specs ?? {},
      status: 'draft',
      created_by: actorId ?? null,
      updated_by: actorId ?? null,
    })
    .select('id')
    .single();

  if (error) throw error;
  return product.id;
}

/**
 * Updates an existing product. Records a slug redirect if the slug was changed.
 */
export async function adminUpdateProduct(
  supabase: SupabaseClient<Database>,
  id: string,
  data: UpdateProductInput,
  actorId?: string
): Promise<void> {
  // Check if slug changed
  if (data.slug) {
    const { data: current } = await supabase.from('products').select('slug').eq('id', id).single();
    if (current && current.slug !== data.slug) {
      // Record redirect from current slug to new slug
      await supabase.from('slug_redirects').upsert(
        {
          old_slug: current.slug,
          new_slug: data.slug,
          product_id: id,
        },
        { onConflict: 'old_slug' }
      );
    }
  }

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    updated_by: actorId ?? null,
  };

  if (data.name !== undefined) updatePayload.name = data.name;
  if (data.slug !== undefined) updatePayload.slug = data.slug;
  if (data.brandId !== undefined) updatePayload.brand_id = data.brandId;
  if (data.categoryId !== undefined) updatePayload.category_id = data.categoryId;
  if (data.shortDescription !== undefined) updatePayload.short_description = data.shortDescription ?? null;
  if (data.description !== undefined) updatePayload.description = data.description ?? null;
  if (data.badge !== undefined) updatePayload.badge = data.badge ?? null;
  if (data.isFeatured !== undefined) updatePayload.is_featured = data.isFeatured;
  if (data.specs !== undefined) updatePayload.specs = data.specs;

  const { error } = await supabase.from('products').update(updatePayload).eq('id', id);
  if (error) throw error;
}

/**
 * Sets product status (draft, published, archived).
 */
export async function adminSetProductStatus(
  supabase: SupabaseClient<Database>,
  id: string,
  status: ProductStatus,
  actorId?: string
): Promise<void> {
  const updatePayload: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
    updated_by: actorId ?? null,
  };

  if (status === 'published') {
    updatePayload.published_at = new Date().toISOString();
  }

  const { error } = await supabase.from('products').update(updatePayload).eq('id', id);
  if (error) throw error;
}

/**
 * Duplicates a product: copies basics and variants (with new SKUs), but not images.
 */
export async function adminDuplicateProduct(
  supabase: SupabaseClient<Database>,
  id: string,
  newSlug: string,
  actorId?: string
): Promise<string> {
  const original = await adminGetProductById(supabase, id);
  if (!original) throw new Error('Product not found');

  const { data: newProd, error: prodErr } = await supabase
    .from('products')
    .insert({
      name: `${original.name} (Copy)`,
      slug: newSlug,
      brand_id: original.brandId,
      category_id: original.categoryId,
      short_description: original.shortDescription,
      description: original.description,
      badge: original.badge,
      is_featured: false,
      specs: original.specs,
      status: 'draft',
      created_by: actorId ?? null,
      updated_by: actorId ?? null,
    })
    .select('id')
    .single();

  if (prodErr || !newProd) throw prodErr;

  // Duplicate variants
  if (original.variants.length > 0) {
    const timestampSuffix = Date.now().toString(36).slice(-4).toUpperCase();
    const newVariants = original.variants.map((v, idx) => ({
      product_id: newProd.id,
      sku: `${v.sku}-COPY-${timestampSuffix}-${idx + 1}`,
      storage_gb: v.storage_gb,
      ram_gb: v.ram_gb,
      color: v.color,
      color_hex: v.color_hex,
      condition: v.condition,
      price_ngn: v.price_ngn,
      compare_at_price_ngn: v.compare_at_price_ngn,
      sale_price_ngn: v.sale_price_ngn,
      sale_starts_at: v.sale_starts_at,
      sale_ends_at: v.sale_ends_at,
      stock_qty: 0, // Reset stock for duplicate
      low_stock_threshold: v.low_stock_threshold,
      warranty_months: v.warranty_months,
      is_active: v.is_active,
      sort_order: v.sort_order,
    }));

    const { error: varErr } = await supabase.from('product_variants').insert(newVariants);
    if (varErr) throw varErr;
  }

  return newProd.id;
}

// ---------------------------------------------------------------------------
// Variant repository methods
// ---------------------------------------------------------------------------

export async function adminCreateVariant(
  supabase: SupabaseClient<Database>,
  data: VariantInput
): Promise<string> {
  // Generate SKU: e.g. KRN-PRODUCT-HEX
  const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  const sku = `KRN-${data.productId.slice(0, 4).toUpperCase()}-${randomSuffix}`;

  const { data: v, error } = await supabase
    .from('product_variants')
    .insert({
      product_id: data.productId,
      sku,
      storage_gb: data.storageGb ?? null,
      ram_gb: data.ramGb ?? null,
      color: data.color ?? null,
      color_hex: data.colorHex ?? null,
      condition: data.condition as ItemCondition,
      price_ngn: data.priceNgn,
      compare_at_price_ngn: data.compareAtPriceNgn ?? null,
      sale_price_ngn: data.salePriceNgn ?? null,
      sale_starts_at: data.saleStartsAt ?? null,
      sale_ends_at: data.saleEndsAt ?? null,
      stock_qty: data.stockQty ?? 0,
      low_stock_threshold: data.lowStockThreshold ?? 2,
      warranty_months: data.warrantyMonths ?? null,
      is_active: data.isActive ?? true,
      sort_order: data.sortOrder ?? 0,
    })
    .select('id')
    .single();

  if (error) throw error;
  return v.id;
}

export async function adminUpdateVariant(
  supabase: SupabaseClient<Database>,
  id: string,
  data: UpdateVariantInput
): Promise<void> {
  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.storageGb !== undefined) updatePayload.storage_gb = data.storageGb ?? null;
  if (data.ramGb !== undefined) updatePayload.ram_gb = data.ramGb ?? null;
  if (data.color !== undefined) updatePayload.color = data.color ?? null;
  if (data.colorHex !== undefined) updatePayload.color_hex = data.colorHex ?? null;
  if (data.condition !== undefined) updatePayload.condition = data.condition;
  if (data.priceNgn !== undefined) updatePayload.price_ngn = data.priceNgn;
  if (data.compareAtPriceNgn !== undefined) updatePayload.compare_at_price_ngn = data.compareAtPriceNgn ?? null;
  if (data.salePriceNgn !== undefined) updatePayload.sale_price_ngn = data.salePriceNgn ?? null;
  if (data.saleStartsAt !== undefined) updatePayload.sale_starts_at = data.saleStartsAt ?? null;
  if (data.saleEndsAt !== undefined) updatePayload.sale_ends_at = data.saleEndsAt ?? null;
  if (data.stockQty !== undefined) updatePayload.stock_qty = data.stockQty;
  if (data.lowStockThreshold !== undefined) updatePayload.low_stock_threshold = data.lowStockThreshold;
  if (data.warrantyMonths !== undefined) updatePayload.warranty_months = data.warrantyMonths ?? null;
  if (data.isActive !== undefined) updatePayload.is_active = data.isActive;
  if (data.sortOrder !== undefined) updatePayload.sort_order = data.sortOrder;

  const { error } = await supabase.from('product_variants').update(updatePayload).eq('id', id);
  if (error) throw error;
}

export async function adminDeleteVariant(
  supabase: SupabaseClient<Database>,
  id: string
): Promise<void> {
  const { error } = await supabase.from('product_variants').delete().eq('id', id);
  if (error) throw error;
}

export async function adminUpdateInlineStock(
  supabase: SupabaseClient<Database>,
  id: string,
  stockQty: number
): Promise<void> {
  const { error } = await supabase
    .from('product_variants')
    .update({ stock_qty: stockQty, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Image repository methods
// ---------------------------------------------------------------------------

export async function adminSetPrimaryImage(
  supabase: SupabaseClient<Database>,
  productId: string,
  imageId: string
): Promise<void> {
  // Set all images for product to is_primary = false
  await supabase
    .from('product_images')
    .update({ is_primary: false })
    .eq('product_id', productId);

  // Set selected to true
  const { error } = await supabase
    .from('product_images')
    .update({ is_primary: true })
    .eq('id', imageId);

  if (error) throw error;
}

export async function adminDeleteProductImage(
  supabase: SupabaseClient<Database>,
  imageId: string
): Promise<void> {
  const { error } = await supabase.from('product_images').delete().eq('id', imageId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Brands & Categories
// ---------------------------------------------------------------------------

export async function adminListAllBrands(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function adminCreateBrand(
  supabase: SupabaseClient<Database>,
  data: BrandInput
): Promise<string> {
  const { data: b, error } = await supabase
    .from('brands')
    .insert({
      name: data.name,
      slug: data.slug,
      logo_path: data.logoPath ?? null,
      sort_order: data.sortOrder ?? 0,
      is_active: true,
    })
    .select('id')
    .single();

  if (error) throw error;
  return b.id;
}

export async function adminUpdateBrand(
  supabase: SupabaseClient<Database>,
  id: string,
  data: UpdateBrandInput
): Promise<void> {
  const updatePayload: Record<string, unknown> = {};
  if (data.name !== undefined) updatePayload.name = data.name;
  if (data.slug !== undefined) updatePayload.slug = data.slug;
  if (data.logoPath !== undefined) updatePayload.logo_path = data.logoPath ?? null;
  if (data.sortOrder !== undefined) updatePayload.sort_order = data.sortOrder;

  const { error } = await supabase.from('brands').update(updatePayload).eq('id', id);
  if (error) throw error;
}

export async function adminReorderBrands(
  supabase: SupabaseClient<Database>,
  items: Array<{ id: string; sortOrder: number }>
): Promise<void> {
  for (const item of items) {
    await supabase.from('brands').update({ sort_order: item.sortOrder }).eq('id', item.id);
  }
}

export async function adminListAllCategories(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function adminCreateCategory(
  supabase: SupabaseClient<Database>,
  data: CategoryInput
): Promise<string> {
  const { data: c, error } = await supabase
    .from('categories')
    .insert({
      name: data.name,
      slug: data.slug,
      parent_id: data.parentId ?? null,
      sort_order: data.sortOrder ?? 0,
      is_active: true,
    })
    .select('id')
    .single();

  if (error) throw error;
  return c.id;
}

export async function adminUpdateCategory(
  supabase: SupabaseClient<Database>,
  id: string,
  data: UpdateCategoryInput
): Promise<void> {
  const updatePayload: Record<string, unknown> = {};
  if (data.name !== undefined) updatePayload.name = data.name;
  if (data.slug !== undefined) updatePayload.slug = data.slug;
  if (data.parentId !== undefined) updatePayload.parent_id = data.parentId ?? null;
  if (data.sortOrder !== undefined) updatePayload.sort_order = data.sortOrder;

  const { error } = await supabase.from('categories').update(updatePayload).eq('id', id);
  if (error) throw error;
}

export async function adminReorderCategories(
  supabase: SupabaseClient<Database>,
  items: Array<{ id: string; sortOrder: number }>
): Promise<void> {
  for (const item of items) {
    await supabase.from('categories').update({ sort_order: item.sortOrder }).eq('id', item.id);
  }
}

// ---------------------------------------------------------------------------
// Bulk Price Candidates & RPC
// ---------------------------------------------------------------------------

export async function adminGetBulkPriceCandidates(
  supabase: SupabaseClient<Database>,
  params: {
    scope: 'brand' | 'category' | 'condition' | 'products';
    scopeId?: string;
    condition?: string;
    productIds?: string[];
  }
): Promise<BulkPricePreviewRow[]> {
  let query = supabase.from('product_variants').select(`
      id, sku, price_ngn, condition,
      products!inner ( id, name, brand_id, category_id )
    `);

  if (params.scope === 'brand' && params.scopeId) {
    query = query.eq('products.brand_id', params.scopeId);
  } else if (params.scope === 'category' && params.scopeId) {
    query = query.eq('products.category_id', params.scopeId);
  } else if (params.scope === 'condition' && params.condition) {
    query = query.eq('condition', params.condition);
  } else if (params.scope === 'products' && params.productIds && params.productIds.length > 0) {
    query = query.in('products.id', params.productIds);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row) => {
    const product = Array.isArray(row.products) ? row.products[0] : row.products;
    return {
      id: row.id,
      sku: row.sku,
      productName: product?.name ?? 'Unknown',
      oldPriceNgn: row.price_ngn,
      newPriceNgn: row.price_ngn,
    };
  });
}

export async function adminApplyBulkPriceRpc(
  supabase: SupabaseClient<Database>,
  changeSet: Array<{ variant_id: string; price_ngn: number }>
): Promise<{ updatedCount: number }> {
  const { data, error } = await supabase.rpc('apply_bulk_price', {
    p_change_set: changeSet,
  });

  if (error) throw error;
  const res = data as { ok: boolean; data?: { updated_count: number }; error?: { message: string } };
  if (!res || !res.ok) {
    throw new Error(res?.error?.message ?? 'Failed to apply bulk price');
  }

  return { updatedCount: res.data?.updated_count ?? 0 };
}

/**
 * Looks up variants by their SKUs for CSV import.
 */
export async function adminGetVariantsBySkus(
  supabase: SupabaseClient<Database>,
  skus: string[]
): Promise<Array<{ id: string; sku: string; priceNgn: number; productName: string }>> {
  if (skus.length === 0) return [];

  const { data, error } = await supabase
    .from('product_variants')
    .select(
      `
      id, sku, price_ngn,
      products!inner ( name )
    `
    )
    .in('sku', skus);

  if (error) throw error;

  return (data ?? []).map((row) => {
    const product = Array.isArray(row.products) ? row.products[0] : row.products;
    return {
      id: row.id,
      sku: row.sku,
      priceNgn: row.price_ngn,
      productName: product?.name ?? 'Unknown',
    };
  });
}
