'use server';

import { revalidateTag } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin, requireOwner } from '@/modules/auth/guards';
import { writeAuditLog } from '@/modules/security/audit';
import { ok, err, type ApiResponse, type ErrorCode } from '@/lib/result';

export type Result<T> = ApiResponse<T>;

function fail(
  code: ErrorCode | 'VALIDATION_ERROR' | 'CONFLICT' | 'INTERNAL_ERROR' | 'INVALID_STATE',
  message: string,
  details?: unknown
): ApiResponse<never> {
  const mappedCode: ErrorCode =
    code === 'VALIDATION_ERROR' || code === 'CONFLICT'
      ? 'VALIDATION_FAILED'
      : code === 'INTERNAL_ERROR'
      ? 'INTERNAL'
      : code === 'INVALID_STATE'
      ? 'INVALID_TRANSITION'
      : code;
  return err(mappedCode, message, details as Record<string, unknown> | undefined);
}
import {
  CreateProductSchema,
  UpdateProductSchema,
  PublishProductSchema,
  ArchiveProductSchema,
  DuplicateProductSchema,
  VariantSchema,
  UpdateVariantSchema,
  DeleteVariantSchema,
  InlineStockUpdateSchema,
  BrandSchema,
  UpdateBrandSchema,
  ReorderBrandsSchema,
  CategorySchema,
  UpdateCategorySchema,
  ReorderCategoriesSchema,
  BulkPriceSchema,
  CsvPriceRowSchema,
  type BulkPricePreviewRow,
} from '@/lib/contracts/catalog';
import {
  adminCreateProduct,
  adminUpdateProduct,
  adminSetProductStatus,
  adminDuplicateProduct,
  adminGetProductById,
  adminIsSlugAvailable,
  adminCreateVariant,
  adminUpdateVariant,
  adminDeleteVariant,
  adminUpdateInlineStock,
  adminSetPrimaryImage,
  adminDeleteProductImage,
  adminCreateBrand,
  adminUpdateBrand,
  adminReorderBrands,
  adminCreateCategory,
  adminUpdateCategory,
  adminReorderCategories,
  adminGetBulkPriceCandidates,
  adminApplyBulkPriceRpc,
  adminGetVariantsBySkus,
} from './admin-repo';
import { generateSlug } from './slug';
import { applyPriceChange } from './bulk-price';
import { checkPublishGuard } from './publish-guard';
import { z } from 'zod';

function revalidateCatalog(slug?: string) {
  try {
    revalidateTag('catalog');
    revalidateTag('products');
    revalidateTag('home');
    if (slug) {
      revalidateTag(`product:${slug}`);
    }
  } catch {
    // revalidateTag might be a no-op outside Next.js request context (e.g. tests)
  }
}

// ---------------------------------------------------------------------------
// Product actions
// ---------------------------------------------------------------------------

export async function createProductAction(rawInput: unknown): Promise<Result<{ id: string }>> {
  const adminCtx = await requireAdmin();
  const parsed = CreateProductSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Invalid product data', parsed.error.flatten().fieldErrors);
  }

  const supabase = await createClient();
  const isAvailable = await adminIsSlugAvailable(supabase, parsed.data.slug);
  if (!isAvailable) {
    return fail('CONFLICT', `Slug "${parsed.data.slug}" is already in use`);
  }

  try {
    const id = await adminCreateProduct(supabase, parsed.data, adminCtx.user.id);

    await writeAuditLog({
      actorId: adminCtx.user.id,
      action: 'product.create',
      entity: 'products',
      entityId: id,
      after: parsed.data,
    });

    revalidateCatalog(parsed.data.slug);
    return ok({ id });
  } catch (err) {
    return fail('INTERNAL_ERROR', err instanceof Error ? err.message : 'Failed to create product');
  }
}

export async function updateProductAction(rawInput: unknown): Promise<Result<{ id: string }>> {
  const adminCtx = await requireAdmin();
  const parsed = UpdateProductSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Invalid product data', parsed.error.flatten().fieldErrors);
  }

  const supabase = await createClient();
  if (parsed.data.slug) {
    const isAvailable = await adminIsSlugAvailable(supabase, parsed.data.slug, parsed.data.id);
    if (!isAvailable) {
      return fail('CONFLICT', `Slug "${parsed.data.slug}" is already in use`);
    }
  }

  try {
    const current = await adminGetProductById(supabase, parsed.data.id);
    if (!current) return fail('NOT_FOUND', 'Product not found');

    await adminUpdateProduct(supabase, parsed.data.id, parsed.data, adminCtx.user.id);

    await writeAuditLog({
      actorId: adminCtx.user.id,
      action: 'product.update',
      entity: 'products',
      entityId: parsed.data.id,
      before: { name: current.name, slug: current.slug },
      after: parsed.data,
    });

    revalidateCatalog(current.slug);
    if (parsed.data.slug && parsed.data.slug !== current.slug) {
      revalidateCatalog(parsed.data.slug);
    }

    return ok({ id: parsed.data.id });
  } catch (err) {
    return fail('INTERNAL_ERROR', err instanceof Error ? err.message : 'Failed to update product');
  }
}

export async function publishProductAction(rawInput: unknown): Promise<Result<{ success: boolean }>> {
  const adminCtx = await requireAdmin();
  const parsed = PublishProductSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Invalid product ID');
  }

  const supabase = await createClient();
  const product = await adminGetProductById(supabase, parsed.data.id);
  if (!product) return fail('NOT_FOUND', 'Product not found');

  // Publish guard validation
  const guard = checkPublishGuard({
    name: product.name,
    slug: product.slug,
    variants: product.variants.map((v) => ({
      id: v.id,
      priceNgn: v.price_ngn,
      isActive: v.is_active,
    })),
    hasPrimaryImageWithAlt: product.images.some((img) => img.is_primary && Boolean(img.alt?.trim())),
  });

  if (!guard.canPublish) {
    return fail('INVALID_STATE', 'Product does not meet publishing requirements', guard.errors);
  }

  try {
    await adminSetProductStatus(supabase, product.id, 'published', adminCtx.user.id);

    await writeAuditLog({
      actorId: adminCtx.user.id,
      action: 'product.publish',
      entity: 'products',
      entityId: product.id,
      before: { status: product.status },
      after: { status: 'published' },
    });

    revalidateCatalog(product.slug);
    return ok({ success: true });
  } catch (err) {
    return fail('INTERNAL_ERROR', err instanceof Error ? err.message : 'Failed to publish product');
  }
}

export async function archiveProductAction(rawInput: unknown): Promise<Result<{ success: boolean }>> {
  const adminCtx = await requireAdmin();
  const parsed = ArchiveProductSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Invalid product ID');
  }

  const supabase = await createClient();
  const product = await adminGetProductById(supabase, parsed.data.id);
  if (!product) return fail('NOT_FOUND', 'Product not found');

  try {
    await adminSetProductStatus(supabase, product.id, 'archived', adminCtx.user.id);

    await writeAuditLog({
      actorId: adminCtx.user.id,
      action: 'product.archive',
      entity: 'products',
      entityId: product.id,
      before: { status: product.status },
      after: { status: 'archived' },
    });

    revalidateCatalog(product.slug);
    return ok({ success: true });
  } catch (err) {
    return fail('INTERNAL_ERROR', err instanceof Error ? err.message : 'Failed to archive product');
  }
}

export async function duplicateProductAction(rawInput: unknown): Promise<Result<{ id: string }>> {
  const adminCtx = await requireAdmin();
  const parsed = DuplicateProductSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Invalid product ID');
  }

  const supabase = await createClient();
  const original = await adminGetProductById(supabase, parsed.data.id);
  if (!original) return fail('NOT_FOUND', 'Product not found');

  let newSlug = generateSlug(`${original.name}-copy`);
  let attempt = 1;
  while (!(await adminIsSlugAvailable(supabase, newSlug))) {
    newSlug = generateSlug(`${original.name}-copy-${attempt}`);
    attempt++;
  }

  try {
    const newId = await adminDuplicateProduct(supabase, original.id, newSlug, adminCtx.user.id);

    await writeAuditLog({
      actorId: adminCtx.user.id,
      action: 'product.duplicate',
      entity: 'products',
      entityId: newId,
      before: { originalId: original.id },
      after: { newSlug },
    });

    revalidateCatalog();
    return ok({ id: newId });
  } catch (err) {
    return fail('INTERNAL_ERROR', err instanceof Error ? err.message : 'Failed to duplicate product');
  }
}

// ---------------------------------------------------------------------------
// Variant actions
// ---------------------------------------------------------------------------

export async function createVariantAction(rawInput: unknown): Promise<Result<{ id: string }>> {
  const adminCtx = await requireAdmin();
  const parsed = VariantSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Invalid variant data', parsed.error.flatten().fieldErrors);
  }

  const supabase = await createClient();
  try {
    const id = await adminCreateVariant(supabase, parsed.data);

    await writeAuditLog({
      actorId: adminCtx.user.id,
      action: 'variant.create',
      entity: 'product_variants',
      entityId: id,
      after: parsed.data,
    });

    revalidateCatalog();
    return ok({ id });
  } catch (err) {
    return fail('INTERNAL_ERROR', err instanceof Error ? err.message : 'Failed to create variant');
  }
}

export async function updateVariantAction(rawInput: unknown): Promise<Result<{ success: boolean }>> {
  const adminCtx = await requireAdmin();
  const parsed = UpdateVariantSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Invalid variant update data', parsed.error.flatten().fieldErrors);
  }

  const supabase = await createClient();
  try {
    const { data: current } = await supabase
      .from('product_variants')
      .select('*')
      .eq('id', parsed.data.id)
      .single();

    await adminUpdateVariant(supabase, parsed.data.id, parsed.data);

    await writeAuditLog({
      actorId: adminCtx.user.id,
      action: 'variant.update',
      entity: 'product_variants',
      entityId: parsed.data.id,
      before: current ?? null,
      after: parsed.data,
    });

    revalidateCatalog();
    return ok({ success: true });
  } catch (err) {
    return fail('INTERNAL_ERROR', err instanceof Error ? err.message : 'Failed to update variant');
  }
}

export async function deleteVariantAction(rawInput: unknown): Promise<Result<{ success: boolean }>> {
  const adminCtx = await requireAdmin();
  const parsed = DeleteVariantSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Invalid variant ID');
  }

  const supabase = await createClient();
  try {
    await adminDeleteVariant(supabase, parsed.data.id);

    await writeAuditLog({
      actorId: adminCtx.user.id,
      action: 'variant.delete',
      entity: 'product_variants',
      entityId: parsed.data.id,
    });

    revalidateCatalog();
    return ok({ success: true });
  } catch (err) {
    return fail('INTERNAL_ERROR', err instanceof Error ? err.message : 'Failed to delete variant');
  }
}

export async function updateInlineStockAction(rawInput: unknown): Promise<Result<{ success: boolean }>> {
  const adminCtx = await requireAdmin();
  const parsed = InlineStockUpdateSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Invalid stock data', parsed.error.flatten().fieldErrors);
  }

  const supabase = await createClient();
  try {
    const { data: current } = await supabase
      .from('product_variants')
      .select('stock_qty')
      .eq('id', parsed.data.id)
      .single();

    await adminUpdateInlineStock(supabase, parsed.data.id, parsed.data.stockQty);

    await writeAuditLog({
      actorId: adminCtx.user.id,
      action: 'stock.inline_update',
      entity: 'product_variants',
      entityId: parsed.data.id,
      before: { stock_qty: current?.stock_qty },
      after: { stock_qty: parsed.data.stockQty },
    });

    revalidateCatalog();
    return ok({ success: true });
  } catch (err) {
    return fail('INTERNAL_ERROR', err instanceof Error ? err.message : 'Failed to update stock');
  }
}

// ---------------------------------------------------------------------------
// Image actions
// ---------------------------------------------------------------------------

export async function setPrimaryImageAction(productId: string, imageId: string): Promise<Result<{ success: boolean }>> {
  const adminCtx = await requireAdmin();
  const supabase = await createClient();
  try {
    await adminSetPrimaryImage(supabase, productId, imageId);

    await writeAuditLog({
      actorId: adminCtx.user.id,
      action: 'image.set_primary',
      entity: 'product_images',
      entityId: imageId,
      after: { productId, isPrimary: true },
    });

    revalidateCatalog();
    return ok({ success: true });
  } catch (err) {
    return fail('INTERNAL_ERROR', err instanceof Error ? err.message : 'Failed to set primary image');
  }
}

export async function deleteProductImageAction(productId: string, imageId: string): Promise<Result<{ success: boolean }>> {
  const adminCtx = await requireAdmin();
  const supabase = await createClient();
  try {
    await adminDeleteProductImage(supabase, imageId);

    await writeAuditLog({
      actorId: adminCtx.user.id,
      action: 'image.delete',
      entity: 'product_images',
      entityId: imageId,
      after: { productId },
    });

    revalidateCatalog();
    return ok({ success: true });
  } catch (err) {
    return fail('INTERNAL_ERROR', err instanceof Error ? err.message : 'Failed to delete image');
  }
}

// ---------------------------------------------------------------------------
// Brands & Categories actions
// ---------------------------------------------------------------------------

export async function createBrandAction(rawInput: unknown): Promise<Result<{ id: string }>> {
  const adminCtx = await requireAdmin();
  const parsed = BrandSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Invalid brand data', parsed.error.flatten().fieldErrors);
  }

  const supabase = await createClient();
  try {
    const id = await adminCreateBrand(supabase, parsed.data);
    await writeAuditLog({
      actorId: adminCtx.user.id,
      action: 'brand.create',
      entity: 'brands',
      entityId: id,
      after: parsed.data,
    });

    revalidateCatalog();
    return ok({ id });
  } catch (err) {
    return fail('INTERNAL_ERROR', err instanceof Error ? err.message : 'Failed to create brand');
  }
}

export async function updateBrandAction(rawInput: unknown): Promise<Result<{ success: boolean }>> {
  const adminCtx = await requireAdmin();
  const parsed = UpdateBrandSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Invalid brand update data', parsed.error.flatten().fieldErrors);
  }

  const supabase = await createClient();
  try {
    await adminUpdateBrand(supabase, parsed.data.id, parsed.data);
    await writeAuditLog({
      actorId: adminCtx.user.id,
      action: 'brand.update',
      entity: 'brands',
      entityId: parsed.data.id,
      after: parsed.data,
    });

    revalidateCatalog();
    return ok({ success: true });
  } catch (err) {
    return fail('INTERNAL_ERROR', err instanceof Error ? err.message : 'Failed to update brand');
  }
}

export async function reorderBrandsAction(rawInput: unknown): Promise<Result<{ success: boolean }>> {
  const adminCtx = await requireAdmin();
  const parsed = ReorderBrandsSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Invalid reorder data');
  }

  const supabase = await createClient();
  try {
    await adminReorderBrands(supabase, parsed.data.items);
    revalidateCatalog();
    return ok({ success: true });
  } catch (err) {
    return fail('INTERNAL_ERROR', err instanceof Error ? err.message : 'Failed to reorder brands');
  }
}

export async function createCategoryAction(rawInput: unknown): Promise<Result<{ id: string }>> {
  const adminCtx = await requireAdmin();
  const parsed = CategorySchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Invalid category data', parsed.error.flatten().fieldErrors);
  }

  const supabase = await createClient();
  try {
    const id = await adminCreateCategory(supabase, parsed.data);
    await writeAuditLog({
      actorId: adminCtx.user.id,
      action: 'category.create',
      entity: 'categories',
      entityId: id,
      after: parsed.data,
    });

    revalidateCatalog();
    return ok({ id });
  } catch (err) {
    return fail('INTERNAL_ERROR', err instanceof Error ? err.message : 'Failed to create category');
  }
}

export async function updateCategoryAction(rawInput: unknown): Promise<Result<{ success: boolean }>> {
  const adminCtx = await requireAdmin();
  const parsed = UpdateCategorySchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Invalid category update data', parsed.error.flatten().fieldErrors);
  }

  const supabase = await createClient();
  try {
    await adminUpdateCategory(supabase, parsed.data.id, parsed.data);
    await writeAuditLog({
      actorId: adminCtx.user.id,
      action: 'category.update',
      entity: 'categories',
      entityId: parsed.data.id,
      after: parsed.data,
    });

    revalidateCatalog();
    return ok({ success: true });
  } catch (err) {
    return fail('INTERNAL_ERROR', err instanceof Error ? err.message : 'Failed to update category');
  }
}

export async function reorderCategoriesAction(rawInput: unknown): Promise<Result<{ success: boolean }>> {
  const adminCtx = await requireAdmin();
  const parsed = ReorderCategoriesSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Invalid reorder data');
  }

  const supabase = await createClient();
  try {
    await adminReorderCategories(supabase, parsed.data.items);
    revalidateCatalog();
    return ok({ success: true });
  } catch (err) {
    return fail('INTERNAL_ERROR', err instanceof Error ? err.message : 'Failed to reorder categories');
  }
}

// ---------------------------------------------------------------------------
// Bulk Price Actions (Owner-Only)
// ---------------------------------------------------------------------------

export async function previewBulkPriceAction(rawInput: unknown): Promise<Result<BulkPricePreviewRow[]>> {
  await requireOwner(); // strictly owner-only
  const parsed = BulkPriceSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Invalid bulk price parameters', parsed.error.flatten().fieldErrors);
  }

  const supabase = await createClient();
  try {
    const candidates = await adminGetBulkPriceCandidates(supabase, {
      scope: parsed.data.scope,
      scopeId: parsed.data.scopeId,
      condition: parsed.data.condition,
      productIds: parsed.data.productIds,
    });

    const preview = candidates.map((c) => ({
      ...c,
      newPriceNgn: applyPriceChange(c.oldPriceNgn, parsed.data.operation, parsed.data.value, parsed.data.roundTo),
    }));

    return ok(preview);
  } catch (err) {
    return fail('INTERNAL_ERROR', err instanceof Error ? err.message : 'Failed to preview bulk price');
  }
}

export async function applyBulkPriceAction(rawInput: unknown): Promise<Result<{ updatedCount: number }>> {
  await requireOwner(); // strictly owner-only
  const parsed = BulkPriceSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Invalid bulk price parameters', parsed.error.flatten().fieldErrors);
  }

  const supabase = await createClient();
  try {
    const candidates = await adminGetBulkPriceCandidates(supabase, {
      scope: parsed.data.scope,
      scopeId: parsed.data.scopeId,
      condition: parsed.data.condition,
      productIds: parsed.data.productIds,
    });

    if (candidates.length === 0) {
      return ok({ updatedCount: 0 });
    }

    const changeSet = candidates.map((c) => ({
      variant_id: c.id,
      price_ngn: applyPriceChange(c.oldPriceNgn, parsed.data.operation, parsed.data.value, parsed.data.roundTo),
    }));

    const result = await adminApplyBulkPriceRpc(supabase, changeSet);
    revalidateCatalog();

    return ok(result);
  } catch (err) {
    return fail('INTERNAL_ERROR', err instanceof Error ? err.message : 'Failed to apply bulk price');
  }
}

export async function importCsvPricesAction(rawInput: unknown): Promise<Result<{ updatedCount: number; notFoundSkus: string[] }>> {
  await requireOwner(); // strictly owner-only
  const parsed = z.array(CsvPriceRowSchema).safeParse(rawInput);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Invalid CSV price rows', parsed.error.flatten().fieldErrors);
  }

  const supabase = await createClient();
  try {
    const skus = parsed.data.map((r) => r.sku);
    const existingVariants = await adminGetVariantsBySkus(supabase, skus);

    const variantBySku = new Map<string, string>();
    for (const v of existingVariants) {
      variantBySku.set(v.sku, v.id);
    }

    const changeSet: Array<{ variant_id: string; price_ngn: number }> = [];
    const notFoundSkus: string[] = [];

    for (const row of parsed.data) {
      const variantId = variantBySku.get(row.sku);
      if (variantId) {
        changeSet.push({ variant_id: variantId, price_ngn: row.priceNgn });
      } else {
        notFoundSkus.push(row.sku);
      }
    }

    let updatedCount = 0;
    if (changeSet.length > 0) {
      const rpcRes = await adminApplyBulkPriceRpc(supabase, changeSet);
      updatedCount = rpcRes.updatedCount;
    }

    revalidateCatalog();
    return ok({ updatedCount, notFoundSkus });
  } catch (err) {
    return fail('INTERNAL_ERROR', err instanceof Error ? err.message : 'Failed to import CSV prices');
  }
}
