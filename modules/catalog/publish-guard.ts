/**
 * Keraunous Tech Store — Publish Guard Rules (U05)
 *
 * Server-side check before transitioning a product to 'published'.
 * Requires:
 * 1. Product name
 * 2. Valid slug
 * 3. At least one active variant with price > 0
 * 4. Primary image with alt text
 */

export interface PublishGuardVariant {
  id: string;
  priceNgn: number;
  isActive: boolean;
}

export interface PublishGuardInput {
  name: string;
  slug: string;
  variants: PublishGuardVariant[];
  hasPrimaryImageWithAlt: boolean;
}

export interface PublishGuardIssue {
  field: string;
  message: string;
}

export interface PublishGuardResult {
  canPublish: boolean;
  errors: PublishGuardIssue[];
}

export function checkPublishGuard(input: PublishGuardInput): PublishGuardResult {
  const errors: PublishGuardIssue[] = [];

  if (!input.name || input.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Product name is required' });
  }

  if (!input.slug || input.slug.trim().length === 0) {
    errors.push({ field: 'slug', message: 'Product slug is required' });
  }

  const activeVariants = (input.variants || []).filter((v) => v.isActive);
  if (activeVariants.length === 0) {
    errors.push({ field: 'variants', message: 'At least one active variant is required to publish' });
  } else if (activeVariants.some((v) => !v.priceNgn || v.priceNgn <= 0)) {
    errors.push({ field: 'variants', message: 'All active variants must have a valid price greater than 0' });
  }

  if (!input.hasPrimaryImageWithAlt) {
    errors.push({ field: 'images', message: 'A primary image with alt text is required before publishing' });
  }

  return {
    canPublish: errors.length === 0,
    errors,
  };
}
