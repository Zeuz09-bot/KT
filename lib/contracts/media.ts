/**
 * Keraunous Tech Store — Media Contracts
 * Zod validation schemas and DTOs for Product Media Service (U04).
 */
import { z } from 'zod';

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const MAX_ORIGINAL_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
export const TARGET_OPTIMIZED_IMAGE_BYTES = 250 * 1024; // 250 KB
export const MAX_IMAGE_DIMENSION_PX = 1600; // 1600 px longest edge

export const RequestUploadUrlSchema = z.object({
  fileName: z
    .string()
    .trim()
    .regex(/\.(jpe?g|png|webp)$/i, 'File must be a JPEG, PNG, or WebP image'),
  contentType: z.enum(ALLOWED_IMAGE_MIME_TYPES, {
    errorMap: () => ({ message: 'Only JPEG, PNG, and WebP images are allowed' }),
  }),
  sizeBytes: z
    .number()
    .int()
    .positive('File size must be positive')
    .max(
      MAX_ORIGINAL_IMAGE_BYTES,
      'Image file exceeds maximum allowed size of 8 MB',
    ),
});

export type RequestUploadUrlInput = z.infer<typeof RequestUploadUrlSchema>;

export const RegisterProductImageSchema = z.object({
  productId: z.string().uuid('Invalid product ID format'),
  path: z
    .string()
    .trim()
    .min(1, 'Storage path is required')
    .regex(/^[0-9a-f-]{36}\.webp$/i, 'Path must be a valid UUID WebP file'),
  alt: z
    .string()
    .trim()
    .min(3, 'Alt text must be at least 3 characters for accessibility')
    .max(200, 'Alt text cannot exceed 200 characters'),
  width: z.number().int().positive('Image width must be a positive integer'),
  height: z.number().int().positive('Image height must be a positive integer'),
  color: z.string().trim().max(50).nullable().optional(),
  isPrimary: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

export type RegisterProductImageInput = z.infer<
  typeof RegisterProductImageSchema
>;

export const DeleteProductImageSchema = z.object({
  imageId: z.string().uuid('Invalid image ID format'),
});

export type DeleteProductImageInput = z.infer<typeof DeleteProductImageSchema>;

export const SetPrimaryImageSchema = z.object({
  productId: z.string().uuid('Invalid product ID format'),
  imageId: z.string().uuid('Invalid image ID format'),
});

export type SetPrimaryImageInput = z.infer<typeof SetPrimaryImageSchema>;

export const ReorderImagesSchema = z.object({
  productId: z.string().uuid('Invalid product ID format'),
  imageIds: z
    .array(z.string().uuid('Invalid image ID format'))
    .min(1, 'At least one image ID is required'),
});

export type ReorderImagesInput = z.infer<typeof ReorderImagesSchema>;

export interface SignedUploadUrlResult {
  uploadUrl: string;
  path: string;
  token: string;
  publicUrl: string;
}

export interface ProductImageDTO {
  id: string;
  productId: string;
  color: string | null;
  path: string;
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  isPrimary: boolean;
  sortOrder: number;
}
