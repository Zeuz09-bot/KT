/**
 * Keraunous Tech Store — Order List & Wishlist Contracts (U09)
 *
 * Schemas and constants for client storage and server resolution.
 * Blueprint §9.5, §10.3, §15.8
 */
import { z } from 'zod';

export const ORDER_LIST_STORAGE_KEY = 'krn:list:v1';
export const WISHLIST_STORAGE_KEY = 'krn:wish:v1';

export const ORDER_LIST_MAX_LINES = 10;
export const ORDER_LIST_MAX_QTY = 5;
export const WISHLIST_MAX_ITEMS = 50;

/** Raw client-stored line */
export const ListLineInputSchema = z.object({
  variantId: z.string().uuid('Invalid variant ID'),
  qty: z.number().int().min(1).max(ORDER_LIST_MAX_QTY),
});
export type ListLineInput = z.infer<typeof ListLineInputSchema>;

/** Request schema for POST /api/list/resolve */
export const ResolveListRequestSchema = z.object({
  items: z.array(ListLineInputSchema).min(1, 'At least one item is required').max(ORDER_LIST_MAX_LINES, `Maximum of ${ORDER_LIST_MAX_LINES} items permitted`),
});
export type ResolveListRequest = z.infer<typeof ResolveListRequestSchema>;

/** Server-resolved line */
export const ResolvedLineSchema = z.object({
  variantId: z.string().uuid(),
  productSlug: z.string(),
  name: z.string(),
  label: z.string(),
  imageUrl: z.string().nullable(),
  unitPriceNgn: z.number().int().nonnegative(),
  qty: z.number().int().min(1).max(ORDER_LIST_MAX_QTY),
  available: z.boolean(),
  maxQty: z.number().int().nonnegative(),
  priceChangedSinceAdded: z.boolean().optional(),
});
export type ResolvedLine = z.infer<typeof ResolvedLineSchema>;

export interface ResolveListResponseData {
  lines: ResolvedLine[];
  subtotalNgn: number;
}

/** Request schema for POST /api/wishlist/resolve */
export const ResolveWishlistRequestSchema = z.object({
  productIds: z.array(z.string().uuid()).min(1).max(WISHLIST_MAX_ITEMS),
});
export type ResolveWishlistRequest = z.infer<typeof ResolveWishlistRequestSchema>;
