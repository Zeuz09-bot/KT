/**
 * Keraunous Tech Store — Unit Tests: Media Service & Contracts (U04)
 *
 * Verifies:
 * - Media validation contracts (RequestUploadUrl, RegisterProductImage, etc.)
 * - File dimension calculation & 1600px longest-edge resizing logic
 * - UUID-only storage path generation (never user-provided filenames)
 * - Strict alt text validation for accessibility
 * - Budget thresholds (8 MB original cap, 250 KB target)
 */

import { describe, it, expect } from 'vitest';
import {
  RequestUploadUrlSchema,
  RegisterProductImageSchema,
  DeleteProductImageSchema,
  SetPrimaryImageSchema,
  ReorderImagesSchema,
  MAX_ORIGINAL_IMAGE_BYTES,
  MAX_IMAGE_DIMENSION_PX,
} from '@/lib/contracts/media';
import {
  calculateTargetDimensions,
  generateStoragePath,
  buildPublicImageUrl,
} from '@/modules/media/pipeline';

describe('Media Contracts & Validation Schemas', () => {
  describe('RequestUploadUrlSchema', () => {
    it('accepts valid JPEG, PNG, and WebP upload requests', () => {
      const validCases = [
        { fileName: 'photo.jpg', contentType: 'image/jpeg', sizeBytes: 1024 * 500 },
        { fileName: 'photo.jpeg', contentType: 'image/jpeg', sizeBytes: 1024 * 500 },
        { fileName: 'render.png', contentType: 'image/png', sizeBytes: 1024 * 1024 },
        { fileName: 'variant.webp', contentType: 'image/webp', sizeBytes: 1024 * 200 },
      ];

      for (const item of validCases) {
        const result = RequestUploadUrlSchema.safeParse(item);
        expect(result.success).toBe(true);
      }
    });

    it('rejects files larger than 8 MB', () => {
      const result = RequestUploadUrlSchema.safeParse({
        fileName: 'huge-photo.jpg',
        contentType: 'image/jpeg',
        sizeBytes: MAX_ORIGINAL_IMAGE_BYTES + 1,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toMatch(/exceeds maximum allowed size/i);
      }
    });

    it('rejects forbidden file types (SVG, PDF, EXE, GIF)', () => {
      const invalidFiles = [
        { fileName: 'malware.exe', contentType: 'image/jpeg', sizeBytes: 5000 },
        { fileName: 'document.pdf', contentType: 'application/pdf', sizeBytes: 5000 },
        { fileName: 'vector.svg', contentType: 'image/svg+xml', sizeBytes: 5000 },
        { fileName: 'animation.gif', contentType: 'image/gif', sizeBytes: 5000 },
      ];

      for (const item of invalidFiles) {
        const result = RequestUploadUrlSchema.safeParse(item);
        expect(result.success).toBe(false);
      }
    });

    it('rejects zero or negative size', () => {
      expect(
        RequestUploadUrlSchema.safeParse({
          fileName: 'empty.jpg',
          contentType: 'image/jpeg',
          sizeBytes: 0,
        }).success,
      ).toBe(false);
    });
  });

  describe('RegisterProductImageSchema', () => {
    const validProductId = '123e4567-e89b-12d3-a456-426614174000';
    const validPath = '550e8400-e29b-41d4-a716-446655440000.webp';

    it('accepts valid image registration with required alt text', () => {
      const result = RegisterProductImageSchema.safeParse({
        productId: validProductId,
        path: validPath,
        alt: 'Samsung Galaxy S25 Ultra Titanium Gray back view',
        width: 1600,
        height: 1200,
        isPrimary: true,
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing or empty alt text (accessibility requirement)', () => {
      const result = RegisterProductImageSchema.safeParse({
        productId: validProductId,
        path: validPath,
        alt: '  ',
        width: 1600,
        height: 1200,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('alt');
      }
    });

    it('rejects non-UUID storage path to prevent arbitrary user-provided filenames', () => {
      const result = RegisterProductImageSchema.safeParse({
        productId: validProductId,
        path: 'user_uploaded_custom_name.png',
        alt: 'Product front image',
        width: 1000,
        height: 1000,
      });
      expect(result.success).toBe(false);
    });

    it('rejects non-positive dimensions', () => {
      expect(
        RegisterProductImageSchema.safeParse({
          productId: validProductId,
          path: validPath,
          alt: 'Product front view',
          width: 0,
          height: 1000,
        }).success,
      ).toBe(false);
    });
  });

  describe('Delete, SetPrimary & Reorder Schemas', () => {
    const validUuid1 = '123e4567-e89b-12d3-a456-426614174000';
    const validUuid2 = '223e4567-e89b-12d3-a456-426614174001';

    it('validates delete schema UUID', () => {
      expect(DeleteProductImageSchema.safeParse({ imageId: validUuid1 }).success).toBe(true);
      expect(DeleteProductImageSchema.safeParse({ imageId: 'not-a-uuid' }).success).toBe(false);
    });

    it('validates set primary schema UUIDs', () => {
      expect(
        SetPrimaryImageSchema.safeParse({
          productId: validUuid1,
          imageId: validUuid2,
        }).success,
      ).toBe(true);
    });

    it('validates reorder schema array', () => {
      expect(
        ReorderImagesSchema.safeParse({
          productId: validUuid1,
          imageIds: [validUuid1, validUuid2],
        }).success,
      ).toBe(true);

      expect(
        ReorderImagesSchema.safeParse({
          productId: validUuid1,
          imageIds: [],
        }).success,
      ).toBe(false);
    });
  });
});

describe('Image Dimension & Pipeline Calculations', () => {
  it('scales down landscape images where width exceeds 1600px', () => {
    const dims = calculateTargetDimensions(3200, 2400, MAX_IMAGE_DIMENSION_PX);
    expect(dims.width).toBe(1600);
    expect(dims.height).toBe(1200);
  });

  it('scales down portrait images where height exceeds 1600px', () => {
    const dims = calculateTargetDimensions(1080, 2160, MAX_IMAGE_DIMENSION_PX);
    expect(dims.height).toBe(1600);
    expect(dims.width).toBe(800);
  });

  it('preserves dimensions when image is already within 1600px', () => {
    const dims = calculateTargetDimensions(1200, 900, MAX_IMAGE_DIMENSION_PX);
    expect(dims.width).toBe(1200);
    expect(dims.height).toBe(900);
  });

  it('handles square images correctly', () => {
    const dims = calculateTargetDimensions(2000, 2000, MAX_IMAGE_DIMENSION_PX);
    expect(dims.width).toBe(1600);
    expect(dims.height).toBe(1600);
  });
});

describe('Storage Helpers', () => {
  it('generates a clean UUID .webp filename', () => {
    const path1 = generateStoragePath();
    const path2 = generateStoragePath();

    expect(path1).toMatch(/^[0-9a-f-]{36}\.webp$/i);
    expect(path2).toMatch(/^[0-9a-f-]{36}\.webp$/i);
    expect(path1).not.toBe(path2);
  });

  it('builds canonical public image URL', () => {
    const url = buildPublicImageUrl(
      'https://ystvghxhyrfteaxjaklm.supabase.co',
      'abc-123.webp',
    );
    expect(url).toBe(
      'https://ystvghxhyrfteaxjaklm.supabase.co/storage/v1/object/public/product-media/abc-123.webp',
    );
  });
});
