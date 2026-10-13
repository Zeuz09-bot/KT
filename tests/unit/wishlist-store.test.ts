/**
 * U09 — Wishlist store logic tests
 * Pure logic: no DOM, tests state operations for device wishlist.
 * Blueprint §9.5: wishlist uses krn:wish:v1 (product IDs).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createWishlistStore,
  type WishlistStore,
  WISHLIST_MAX_ITEMS,
} from '../../lib/hooks/wishlist-store';

let store: WishlistStore;

beforeEach(() => {
  store = createWishlistStore([]);
});

describe('add', () => {
  it('adds a product ID to wishlist', () => {
    store.add('prod-1');
    expect(store.items()).toEqual(['prod-1']);
  });

  it('does not duplicate existing product ID', () => {
    store.add('prod-1');
    store.add('prod-1');
    expect(store.items()).toEqual(['prod-1']);
  });

  it('enforces maximum item limit', () => {
    for (let i = 0; i < WISHLIST_MAX_ITEMS + 10; i++) {
      store.add(`prod-${i}`);
    }
    expect(store.items().length).toBe(WISHLIST_MAX_ITEMS);
  });
});

describe('remove', () => {
  it('removes an existing product ID', () => {
    store.add('prod-1');
    store.add('prod-2');
    store.remove('prod-1');
    expect(store.items()).toEqual(['prod-2']);
  });

  it('is a no-op if product ID does not exist', () => {
    store.add('prod-1');
    store.remove('prod-999');
    expect(store.items()).toEqual(['prod-1']);
  });
});

describe('toggle', () => {
  it('adds product ID if not present', () => {
    const isNowWishlisted = store.toggle('prod-1');
    expect(isNowWishlisted).toBe(true);
    expect(store.has('prod-1')).toBe(true);
  });

  it('removes product ID if already present', () => {
    store.add('prod-1');
    const isNowWishlisted = store.toggle('prod-1');
    expect(isNowWishlisted).toBe(false);
    expect(store.has('prod-1')).toBe(false);
  });
});

describe('has', () => {
  it('returns true when product is in wishlist', () => {
    store.add('prod-1');
    expect(store.has('prod-1')).toBe(true);
    expect(store.has('prod-2')).toBe(false);
  });
});

describe('clear', () => {
  it('removes all items from wishlist', () => {
    store.add('prod-1');
    store.add('prod-2');
    store.clear();
    expect(store.items()).toEqual([]);
    expect(store.count()).toBe(0);
  });
});

describe('count', () => {
  it('returns the number of unique items', () => {
    expect(store.count()).toBe(0);
    store.add('prod-1');
    store.add('prod-2');
    expect(store.count()).toBe(2);
  });
});
