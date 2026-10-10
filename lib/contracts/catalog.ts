/**
 * Keraunous Tech Store — Catalogue Contracts (U05 + U07)
 *
 * Zod schemas and TypeScript types for all catalogue admin operations.
 * Product creation, variant management, brand/category CRUD, bulk pricing, CSV import.
 * Storefront projection schemas and logic (U07).
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

/** Kebab-case, lowercase, no consecutive hyphens, 2–100 chars */
export const SlugSchema = z
  .string()
  .min(2, 'Slug must be at least 2 characters')
  .max(100, 'Slug must be 100 characters or fewer')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, digits and single hyphens only');

/** Integer Naira — positive, no decimals */
export const NairaSchema = z.number().int('Price must be a whole number of Naira').positive('Price must be greater than 0');

/** Nullable integer Naira */
export const NullableNairaSchema = NairaSchema.nullable().optional();

// ---------------------------------------------------------------------------
// Specs (§9.8)
// ---------------------------------------------------------------------------

export const SpecsSchema = z
  .object({
    display:       z.string(),
    screen_inches: z.string(),
    chip:          z.string(),
    rear_camera:   z.string(),
    front_camera:  z.string(),
    battery:       z.string(),
    os:            z.string(),
    network:       z.string(),
    sim:           z.string(),
    in_the_box:    z.string(),
  })
  .partial()
  .strict(); // reject unknown spec keys to avoid typos being silently stored

export type Specs = z.infer<typeof SpecsSchema>;

// ---------------------------------------------------------------------------
// Product schemas
// ---------------------------------------------------------------------------

export const CreateProductSchema = z.object({
  name:             z.string().min(2, 'Name must be at least 2 characters').max(120, 'Name must be 120 characters or fewer'),
  slug:             SlugSchema,
  brandId:          z.string().uuid('Invalid brand ID'),
  categoryId:       z.string().uuid('Invalid category ID'),
  shortDescription: z.string().max(200, 'Short description must be 200 characters or fewer').optional(),
  description:      z.string().max(5000, 'Description must be 5000 characters or fewer').optional(),
  badge:            z.enum(['new', 'best_seller', 'hot', 'limited']).nullable().optional(),
  isFeatured:       z.boolean().optional(),
  specs:            SpecsSchema.optional(),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;

export const UpdateProductSchema = CreateProductSchema.partial().extend({
  id: z.string().uuid('Invalid product ID'),
});

export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;

export const PublishProductSchema = z.object({
  id: z.string().uuid(),
});

export const ArchiveProductSchema = z.object({
  id: z.string().uuid(),
});

export const DuplicateProductSchema = z.object({
  id: z.string().uuid(),
});

// ---------------------------------------------------------------------------
// Variant schemas
// ---------------------------------------------------------------------------

export const VariantShape = z.object({
  productId:         z.string().uuid('Invalid product ID'),
  storageGb:         z.number().int().positive().nullable().optional(),
  ramGb:             z.number().int().positive().nullable().optional(),
  color:             z.string().max(60).nullable().optional(),
  colorHex:          z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color hex must be a valid 6-digit hex code').nullable().optional(),
  condition:         z.enum(['brand_new', 'uk_used', 'open_box']),
  priceNgn:          NairaSchema,
  compareAtPriceNgn: NullableNairaSchema,
  salePriceNgn:      NullableNairaSchema,
  saleStartsAt:      z.string().datetime().nullable().optional(),
  saleEndsAt:        z.string().datetime().nullable().optional(),
  stockQty:          z.number().int().min(0, 'Stock cannot be negative').default(0),
  lowStockThreshold: z.number().int().min(0).default(2),
  warrantyMonths:    z.number().int().min(0).max(36).nullable().optional(),
  isActive:          z.boolean().default(true),
  sortOrder:         z.number().int().min(0).default(0),
});

export const VariantSchema = VariantShape
  .refine(
    (v) => !v.compareAtPriceNgn || v.compareAtPriceNgn > v.priceNgn,
    { message: 'Compare-at price must be greater than the regular price', path: ['compareAtPriceNgn'] },
  )
  .refine(
    (v) => !v.salePriceNgn || v.salePriceNgn < v.priceNgn,
    { message: 'Sale price must be less than the regular price', path: ['salePriceNgn'] },
  )
  .refine(
    (v) => !v.saleEndsAt || !v.saleStartsAt || new Date(v.saleEndsAt) > new Date(v.saleStartsAt),
    { message: 'Sale end time must be after sale start time', path: ['saleEndsAt'] },
  );

export type VariantInput = z.infer<typeof VariantSchema>;

export const UpdateVariantSchema = VariantShape.partial().omit({ productId: true }).extend({
  id: z.string().uuid('Invalid variant ID'),
});

export type UpdateVariantInput = z.infer<typeof UpdateVariantSchema>;

export const DeleteVariantSchema = z.object({
  id: z.string().uuid(),
});

export const InlineStockUpdateSchema = z.object({
  id:       z.string().uuid('Invalid variant ID'),
  stockQty: z.number().int().min(0, 'Stock cannot be negative'),
});

// ---------------------------------------------------------------------------
// Brand schemas
// ---------------------------------------------------------------------------

export const BrandSchema = z.object({
  name:      z.string().min(1, 'Brand name is required').max(80),
  slug:      SlugSchema,
  logoPath:  z.string().optional(),
  sortOrder: z.number().int().min(0).default(0),
});

export type BrandInput = z.infer<typeof BrandSchema>;

export const UpdateBrandSchema = BrandSchema.partial().extend({
  id: z.string().uuid('Invalid brand ID'),
});

export type UpdateBrandInput = z.infer<typeof UpdateBrandSchema>;

export const ReorderBrandsSchema = z.object({
  /** Array of { id, sortOrder } pairs to apply */
  items: z.array(z.object({ id: z.string().uuid(), sortOrder: z.number().int().min(0) })).min(1),
});

// ---------------------------------------------------------------------------
// Category schemas
// ---------------------------------------------------------------------------

export const CategorySchema = z.object({
  name:      z.string().min(1, 'Category name is required').max(80),
  slug:      SlugSchema,
  parentId:  z.string().uuid().nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
});

export type CategoryInput = z.infer<typeof CategorySchema>;

export const UpdateCategorySchema = CategorySchema.partial().extend({
  id: z.string().uuid('Invalid category ID'),
});

export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;

export const ReorderCategoriesSchema = z.object({
  items: z.array(z.object({ id: z.string().uuid(), sortOrder: z.number().int().min(0) })).min(1),
});

// ---------------------------------------------------------------------------
// Bulk price schemas
// ---------------------------------------------------------------------------

export const BulkPriceSchema = z.object({
  scope:      z.enum(['brand', 'category', 'condition', 'products']),
  scopeId:    z.string().uuid().optional(),           // brand/category ID for those scopes
  condition:  z.enum(['brand_new', 'uk_used', 'open_box']).optional(), // for condition scope
  productIds: z.array(z.string().uuid()).min(1).optional(),            // for products scope
  operation:  z.enum(['increase_pct', 'decrease_pct']),
  value:      z.number().positive('Percentage must be greater than 0').max(100, 'Percentage cannot exceed 100'),
  roundTo:    z.union([z.literal(500), z.literal(1000), z.literal(5000)]).optional(),
});

export type BulkPriceInput = z.infer<typeof BulkPriceSchema>;

/** One row in the bulk price preview / apply set */
export type BulkPricePreviewRow = {
  id:          string;
  sku:         string;
  productName: string;
  oldPriceNgn: number;
  newPriceNgn: number;
};

// ---------------------------------------------------------------------------
// CSV price import schemas
// ---------------------------------------------------------------------------

export const CsvPriceRowSchema = z.object({
  sku:      z.string().min(1, 'SKU is required'),
  priceNgn: z.number().int('Price must be a whole number of Naira').positive('Price must be greater than 0'),
});

export type CsvPriceRow = z.infer<typeof CsvPriceRowSchema>;

export type CsvParseResult = {
  rows:   CsvPriceRow[];
  errors: Array<{ row: number; message: string }>;
};

// ---------------------------------------------------------------------------
// Publish guard types (used by both tests and actions)
// ---------------------------------------------------------------------------

export type PublishGuardError = { field: string; message: string };

export type PublishGuardResult = {
  canPublish: boolean;
  errors:     PublishGuardError[];
};

// ---------------------------------------------------------------------------
// Storefront schemas (U07)
// ---------------------------------------------------------------------------

export const listingFiltersSchema = z.object({
  brand: z.string().optional(),
  category: z.string().optional(),
  sort: z.enum(['price_asc', 'price_desc', 'newest']).default('newest'),
  page: z.coerce.number().min(1).default(1),
  condition: z.enum(['brand_new', 'uk_used', 'open_box']).optional(),
  search: z.string().optional(),
});

export type ListingFilters = z.infer<typeof listingFiltersSchema>;

export function parseListingFilters(searchParams: URLSearchParams | { [key: string]: string | string[] | undefined }): ListingFilters {
  const params: Record<string, any> = {};
  
  if (searchParams instanceof URLSearchParams) {
    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }
  } else {
    for (const key of Object.keys(searchParams)) {
      const val = searchParams[key];
      if (Array.isArray(val)) params[key] = val[0];
      else if (val) params[key] = val;
    }
  }

  return listingFiltersSchema.parse(params);
}

// Storefront Product Projection
export interface StorefrontProduct {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  description: string | null;
  badge: string | null;
  is_featured: boolean;
  specs: Specs | null;
  brand: { id: string; name: string; slug: string };
  category: { id: string; name: string; slug: string };
  variants: StorefrontVariant[];
  lowest_price: number;
  total_stock: number;
  featured_image: string | null;
}

export interface StorefrontVariant {
  id: string;
  product_id: string;
  storage_gb: number | null;
  ram_gb: number | null;
  color: string | null;
  color_hex: string | null;
  condition: 'brand_new' | 'uk_used' | 'open_box';
  price_ngn: number;
  sale_price_ngn: number | null;
  compare_at_price_ngn: number | null;
  sale_starts_at: string | null;
  sale_ends_at: string | null;
  stock_qty: number;
  warranty_months: number | null;
}

export function formatWarranty(condition: string, months?: number | null): string {
  const m = months ?? (condition === 'brand_new' ? 12 : 3);
  if (condition === 'brand_new') return `${m} Months Official Warranty`;
  if (condition === 'uk_used') return `${m} Months Store Warranty`;
  return `${m} Months Warranty`;
}

// Variant resolution algorithm
export function resolveVariant(variants: StorefrontVariant[], selection: Partial<StorefrontVariant>): StorefrontVariant | null {
  if (!variants || variants.length === 0) return null;

  // Exact match
  const exactMatch = variants.find((v) => {
    let match = true;
    if (selection.storage_gb !== undefined && v.storage_gb !== selection.storage_gb) match = false;
    if (selection.color !== undefined && v.color !== selection.color) match = false;
    if (selection.condition !== undefined && v.condition !== selection.condition) match = false;
    return match;
  });

  if (exactMatch && exactMatch.stock_qty > 0) return exactMatch;
  if (exactMatch) return exactMatch; // Even if out of stock

  // Fallback to cheapest in stock
  const inStock = variants.filter(v => v.stock_qty > 0);
  if (inStock.length > 0) {
    return inStock.reduce((prev, curr) => (curr.sale_price_ngn ?? curr.price_ngn) < (prev.sale_price_ngn ?? prev.price_ngn) ? curr : prev);
  }

  // Fallback to cheapest overall
  return variants.reduce((prev, curr) => (curr.sale_price_ngn ?? curr.price_ngn) < (prev.sale_price_ngn ?? prev.price_ngn) ? curr : prev);
}
