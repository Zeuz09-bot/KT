/**
 * Keraunous Tech Store — Media Repository
 * Queries and updates the `product_images` database table.
 */
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type {
  ProductImageDTO,
  RegisterProductImageInput,
} from '@/lib/contracts/media';
import { buildPublicImageUrl } from './pipeline';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

function toDTO(
  row: Database['public']['Tables']['product_images']['Row'],
): ProductImageDTO {
  return {
    id: row.id,
    productId: row.product_id,
    color: row.color,
    path: row.path,
    url: buildPublicImageUrl(SUPABASE_URL, row.path),
    alt: row.alt,
    width: row.width,
    height: row.height,
    isPrimary: row.is_primary,
    sortOrder: row.sort_order,
  };
}

/**
 * Retrieves all images for a given product ordered by sort_order.
 */
export async function getProductImagesByProductId(
  supabase: SupabaseClient<Database>,
  productId: string,
): Promise<ProductImageDTO[]> {
  const { data, error } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true });

  if (error || !data) return [];

  return data.map(toDTO);
}

/**
 * Inserts a new image record into product_images.
 */
export async function insertProductImage(
  supabase: SupabaseClient<Database>,
  input: RegisterProductImageInput,
): Promise<{ image: ProductImageDTO | null; error?: string }> {
  // If this image is designated as primary, unset other primaries for this product first
  if (input.isPrimary) {
    await supabase
      .from('product_images')
      .update({ is_primary: false })
      .eq('product_id', input.productId);
  }

  const { data, error } = await supabase
    .from('product_images')
    .insert({
      product_id: input.productId,
      path: input.path,
      alt: input.alt,
      width: input.width,
      height: input.height,
      color: input.color ?? null,
      is_primary: input.isPrimary,
      sort_order: input.sortOrder,
    })
    .select()
    .single();

  if (error || !data) {
    return { image: null, error: error?.message || 'Failed to insert image record' };
  }

  return { image: toDTO(data) };
}

/**
 * Deletes an image record from product_images and returns its path for storage deletion.
 */
export async function deleteProductImage(
  supabase: SupabaseClient<Database>,
  imageId: string,
): Promise<{ ok: boolean; path?: string; productId?: string; error?: string }> {
  // Fetch path first
  const { data: existing, error: fetchError } = await supabase
    .from('product_images')
    .select('path, product_id, is_primary')
    .eq('id', imageId)
    .single();

  if (fetchError || !existing) {
    return { ok: false, error: 'Image not found' };
  }

  const { error: deleteError } = await supabase
    .from('product_images')
    .delete()
    .eq('id', imageId);

  if (deleteError) {
    return { ok: false, error: deleteError.message };
  }

  // If deleted image was primary, assign primary to the first remaining image
  if (existing.is_primary) {
    const { data: remaining } = await supabase
      .from('product_images')
      .select('id')
      .eq('product_id', existing.product_id)
      .order('sort_order', { ascending: true })
      .limit(1);

    if (remaining && remaining.length > 0) {
      await supabase
        .from('product_images')
        .update({ is_primary: true })
        .eq('id', remaining[0].id);
    }
  }

  return {
    ok: true,
    path: existing.path,
    productId: existing.product_id,
  };
}

/**
 * Designates an image as the primary image for a product.
 */
export async function setPrimaryProductImage(
  supabase: SupabaseClient<Database>,
  productId: string,
  imageId: string,
): Promise<{ ok: boolean; error?: string }> {
  // Unset all for this product
  await supabase
    .from('product_images')
    .update({ is_primary: false })
    .eq('product_id', productId);

  // Set selected
  const { error } = await supabase
    .from('product_images')
    .update({ is_primary: true })
    .eq('id', imageId)
    .eq('product_id', productId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

/**
 * Updates sort order for a batch of images.
 */
export async function reorderProductImages(
  supabase: SupabaseClient<Database>,
  productId: string,
  imageIds: string[],
): Promise<{ ok: boolean; error?: string }> {
  for (let i = 0; i < imageIds.length; i++) {
    const { error } = await supabase
      .from('product_images')
      .update({ sort_order: i })
      .eq('id', imageIds[i])
      .eq('product_id', productId);

    if (error) {
      return { ok: false, error: error.message };
    }
  }

  return { ok: true };
}
