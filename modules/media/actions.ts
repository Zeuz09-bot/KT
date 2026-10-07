'use server';

/**
 * Keraunous Tech Store — Media Server Actions
 *
 * All operations enforce admin authentication, active status, and AAL2 MFA.
 * Includes audit logging and UUID path generation.
 */

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ok, err, ApiResponse } from '@/lib/result';
import { requireAdmin } from '@/modules/auth/guards';
import { writeAuditLog } from '@/modules/security/audit';
import {
  RequestUploadUrlSchema,
  RegisterProductImageSchema,
  DeleteProductImageSchema,
  SetPrimaryImageSchema,
  ReorderImagesSchema,
  SignedUploadUrlResult,
  ProductImageDTO,
} from '@/lib/contracts/media';
import {
  generateStoragePath,
  buildPublicImageUrl,
} from './pipeline';
import {
  insertProductImage,
  deleteProductImage,
  setPrimaryProductImage,
  reorderProductImages,
} from './repo';

const BUCKET_NAME = 'product-media';

/**
 * Issues a signed upload URL for a validated image file.
 * Requires administrator privileges with AAL2 MFA.
 */
export async function requestUploadUrlAction(
  input: unknown,
): Promise<ApiResponse<SignedUploadUrlResult>> {
  await requireAdmin();

  const parsed = RequestUploadUrlSchema.safeParse(input);
  if (!parsed.success) {
    return err(
      'VALIDATION_FAILED',
      parsed.error.errors[0]?.message || 'Invalid upload parameters.',
      { errors: parsed.error.flatten().fieldErrors },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const path = generateStoragePath();
  const adminClient = createAdminClient();

  // Create signed upload URL (default 2-hour window in storage-js 2.7.1)
  const { data, error } = await adminClient.storage
    .from(BUCKET_NAME)
    .createSignedUploadUrl(path);

  if (error || !data) {
    return err(
      'INTERNAL',
      error?.message || 'Failed to generate signed upload URL.',
    );
  }

  return ok({
    uploadUrl: data.signedUrl,
    path,
    token: data.token,
    publicUrl: buildPublicImageUrl(supabaseUrl, path),
  });
}

/**
 * Registers an uploaded image in the product_images database table.
 * Requires administrator privileges with AAL2 MFA and mandatory alt text.
 */
export async function registerProductImageAction(
  input: unknown,
): Promise<ApiResponse<ProductImageDTO>> {
  const { user } = await requireAdmin();

  const parsed = RegisterProductImageSchema.safeParse(input);
  if (!parsed.success) {
    return err(
      'VALIDATION_FAILED',
      parsed.error.errors[0]?.message || 'Invalid product image details.',
      { errors: parsed.error.flatten().fieldErrors },
    );
  }

  const supabase = await createClient();
  const { image, error } = await insertProductImage(supabase, parsed.data);

  if (error || !image) {
    return err('INTERNAL', error || 'Failed to register product image.');
  }

  await writeAuditLog({
    actorId: user.id,
    action: 'product_image.created',
    entity: 'product_images',
    entityId: image.id,
    after: {
      productId: image.productId,
      path: image.path,
      alt: image.alt,
      width: image.width,
      height: image.height,
      isPrimary: image.isPrimary,
    },
  });

  return ok(image);
}

/**
 * Deletes a product image from the database and removes the storage file.
 * Requires administrator privileges with AAL2 MFA.
 */
export async function deleteProductImageAction(
  input: unknown,
): Promise<ApiResponse<{ deleted: boolean }>> {
  const { user } = await requireAdmin();

  const parsed = DeleteProductImageSchema.safeParse(input);
  if (!parsed.success) {
    return err('VALIDATION_FAILED', 'Invalid image ID.');
  }

  const supabase = await createClient();
  const res = await deleteProductImage(supabase, parsed.data.imageId);

  if (!res.ok) {
    return err('INTERNAL', res.error || 'Failed to delete image record.');
  }

  // Remove file from storage
  if (res.path) {
    const adminClient = createAdminClient();
    await adminClient.storage.from(BUCKET_NAME).remove([res.path]);
  }

  await writeAuditLog({
    actorId: user.id,
    action: 'product_image.deleted',
    entity: 'product_images',
    entityId: parsed.data.imageId,
    before: { path: res.path, productId: res.productId },
  });

  return ok({ deleted: true });
}

/**
 * Sets the primary image for a product.
 * Requires administrator privileges with AAL2 MFA.
 */
export async function setPrimaryImageAction(
  input: unknown,
): Promise<ApiResponse<{ success: boolean }>> {
  const { user } = await requireAdmin();

  const parsed = SetPrimaryImageSchema.safeParse(input);
  if (!parsed.success) {
    return err('VALIDATION_FAILED', 'Invalid product or image ID.');
  }

  const supabase = await createClient();
  const res = await setPrimaryProductImage(
    supabase,
    parsed.data.productId,
    parsed.data.imageId,
  );

  if (!res.ok) {
    return err('INTERNAL', res.error || 'Failed to set primary image.');
  }

  await writeAuditLog({
    actorId: user.id,
    action: 'product_image.set_primary',
    entity: 'product_images',
    entityId: parsed.data.imageId,
    after: { productId: parsed.data.productId },
  });

  return ok({ success: true });
}

/**
 * Reorders product images.
 * Requires administrator privileges with AAL2 MFA.
 */
export async function reorderProductImagesAction(
  input: unknown,
): Promise<ApiResponse<{ success: boolean }>> {
  await requireAdmin();

  const parsed = ReorderImagesSchema.safeParse(input);
  if (!parsed.success) {
    return err('VALIDATION_FAILED', 'Invalid reorder data.');
  }

  const supabase = await createClient();
  const res = await reorderProductImages(
    supabase,
    parsed.data.productId,
    parsed.data.imageIds,
  );

  if (!res.ok) {
    return err('INTERNAL', res.error || 'Failed to reorder images.');
  }

  return ok({ success: true });
}
