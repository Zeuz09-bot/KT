/**
 * Pure state logic for the Wishlist.
 * Testable without DOM or React.
 * Blueprint §9.5: wishlist uses krn:wish:v1 (product IDs).
 */
import { WISHLIST_MAX_ITEMS } from '@/lib/contracts/list';

export { WISHLIST_MAX_ITEMS };

export interface WishlistStore {
  items: () => string[];
  add: (productId: string) => void;
  remove: (productId: string) => void;
  toggle: (productId: string) => boolean;
  has: (productId: string) => boolean;
  clear: () => void;
  count: () => number;
}

export function createWishlistStore(initialItems: string[] = []): WishlistStore {
  let list: string[] = [];

  for (const item of initialItems) {
    if (list.length >= WISHLIST_MAX_ITEMS) break;
    if (!list.includes(item)) {
      list.push(item);
    }
  }

  return {
    items: () => [...list],

    add: (productId: string) => {
      if (list.includes(productId)) return;
      if (list.length >= WISHLIST_MAX_ITEMS) return;
      list.push(productId);
    },

    remove: (productId: string) => {
      list = list.filter((id) => id !== productId);
    },

    toggle: (productId: string) => {
      if (list.includes(productId)) {
        list = list.filter((id) => id !== productId);
        return false;
      }
      if (list.length < WISHLIST_MAX_ITEMS) {
        list.push(productId);
      }
      return true;
    },

    has: (productId: string) => {
      return list.includes(productId);
    },

    clear: () => {
      list = [];
    },

    count: () => {
      return list.length;
    },
  };
}
