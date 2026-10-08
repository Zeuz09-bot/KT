/**
 * Keraunous Tech Store — Slug Utilities (U05)
 *
 * Pure functions — no database calls.
 * Database uniqueness checks live in admin-repo.ts.
 */

/**
 * Converts a product name into a URL-safe kebab-case slug.
 * e.g. "Apple iPhone 15 Pro Max" → "apple-iphone-15-pro-max"
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    // Replace any non-alphanumeric character with a hyphen
    .replace(/[^a-z0-9]+/g, '-')
    // Collapse consecutive hyphens
    .replace(/-{2,}/g, '-')
    // Strip leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
}

/**
 * Normalises a user-provided slug: lowercase, trim, spaces→hyphens.
 * Does NOT enforce the full SlugSchema regex — use the schema for final validation.
 */
export function normaliseSlug(slug: string): string {
  return slug
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}
