/**
 * Keraunous Tech Store — Media Pipeline
 *
 * Implements client-side image processing, dimension calculation,
 * EXIF stripping, WebP compression, and target budget enforcement (≤ 250 KB).
 */

import {
  MAX_ORIGINAL_IMAGE_BYTES,
  MAX_IMAGE_DIMENSION_PX,
  TARGET_OPTIMIZED_IMAGE_BYTES,
  ALLOWED_IMAGE_MIME_TYPES,
} from '@/lib/contracts/media';

export interface ProcessedImageResult {
  blob: Blob;
  width: number;
  height: number;
  sizeBytes: number;
  path: string;
}

/**
 * Calculates target dimensions preserving aspect ratio while ensuring
 * the longest edge does not exceed `maxDimension` (1600 px).
 */
export function calculateTargetDimensions(
  origWidth: number,
  origHeight: number,
  maxDimension = MAX_IMAGE_DIMENSION_PX,
): { width: number; height: number } {
  if (origWidth <= maxDimension && origHeight <= maxDimension) {
    return { width: origWidth, height: origHeight };
  }

  if (origWidth >= origHeight) {
    const ratio = maxDimension / origWidth;
    return {
      width: maxDimension,
      height: Math.round(origHeight * ratio),
    };
  } else {
    const ratio = maxDimension / origHeight;
    return {
      width: Math.round(origWidth * ratio),
      height: maxDimension,
    };
  }
}

/**
 * Generates a collision-resistant UUID filename with .webp extension.
 * Never uses user-supplied filenames.
 */
export function generateStoragePath(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${crypto.randomUUID()}.webp`;
  }
  // Fallback for environments without crypto.randomUUID
  const s4 = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  return `${s4()}${s4()}-${s4()}-4${s4().substr(0, 3)}-${s4()}-${s4()}${s4()}${s4()}.webp`;
}

/**
 * Returns the canonical public URL for an image in the product-media bucket.
 */
export function buildPublicImageUrl(supabaseUrl: string, path: string): string {
  const cleanBase = supabaseUrl.replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/+/, '');
  return `${cleanBase}/storage/v1/object/public/product-media/${cleanPath}`;
}

/**
 * Helper to convert canvas to a Blob with given quality.
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob);
      },
      'image/webp',
      quality,
    );
  });
}

/**
 * Browser-side pipeline:
 * 1. Validates format (JPEG, PNG, WebP)
 * 2. Rejects files > 8 MB
 * 3. Draws to Canvas (stripping all EXIF camera/GPS data)
 * 4. Resizes longest edge to max 1600 px
 * 5. Compresses to WebP targeting <= 250 KB budget
 */
export async function processImageForUpload(
  file: File,
): Promise<ProcessedImageResult> {
  // 1. Validation
  const isAllowed = (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(
    file.type,
  );
  if (!isAllowed) {
    throw new Error(
      `Unsupported image type "${file.type}". Please upload a JPEG, PNG, or WebP image.`,
    );
  }

  if (file.size > MAX_ORIGINAL_IMAGE_BYTES) {
    throw new Error(
      `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the maximum allowed 8 MB.`,
    );
  }

  if (typeof window === 'undefined') {
    throw new Error('Image pipeline must run in a browser environment.');
  }

  // 2. Load into HTML Image element
  const objectUrl = URL.createObjectURL(file);
  const img = new Image();

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load image for processing.'));
    img.src = objectUrl;
  });

  // Calculate target dimensions
  const { width, height } = calculateTargetDimensions(
    img.naturalWidth || img.width,
    img.naturalHeight || img.height,
    MAX_IMAGE_DIMENSION_PX,
  );

  // 3. Draw on fresh canvas (strips EXIF & downscales)
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    URL.revokeObjectURL(objectUrl);
    throw new Error('Could not initialize 2D canvas context.');
  }

  // Use high-quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);
  URL.revokeObjectURL(objectUrl);

  // 4. WebP compression loop (attempts 0.82 -> 0.75 -> 0.68 to stay within 250 KB)
  let quality = 0.82;
  let blob = await canvasToBlob(canvas, quality);

  if (!blob) {
    throw new Error('Failed to generate WebP image from canvas.');
  }

  if (blob.size > TARGET_OPTIMIZED_IMAGE_BYTES) {
    quality = 0.74;
    const secondTry = await canvasToBlob(canvas, quality);
    if (secondTry && secondTry.size < blob.size) {
      blob = secondTry;
    }
  }

  if (blob.size > TARGET_OPTIMIZED_IMAGE_BYTES) {
    quality = 0.66;
    const thirdTry = await canvasToBlob(canvas, quality);
    if (thirdTry && thirdTry.size < blob.size) {
      blob = thirdTry;
    }
  }

  const path = generateStoragePath();

  return {
    blob,
    width,
    height,
    sizeBytes: blob.size,
    path,
  };
}
