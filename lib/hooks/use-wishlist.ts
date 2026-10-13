/**
 * useWishlist hook (U09)
 * Manages wishlist in localStorage ('krn:wish:v1') with cross-tab and in-tab sync.
 * Blueprint §9.5, §10.3
 */
'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import {
  WISHLIST_STORAGE_KEY,
} from '@/lib/contracts/list';
import {
  createWishlistStore,
  WISHLIST_MAX_ITEMS,
} from './wishlist-store';

const WISHLIST_EVENT = 'krn:wishlist-change';

function readStoredItems(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((id) => typeof id === 'string');
    }
  } catch {
    // In-memory fallback
  }
  return [];
}

function writeStoredItems(items: string[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(WISHLIST_EVENT));
  } catch {
    // Quota or private browsing restriction
  }
}

let memoryListeners: Array<() => void> = [];

function subscribe(callback: () => void) {
  memoryListeners.push(callback);

  const handleStorage = (e: StorageEvent) => {
    if (e.key === WISHLIST_STORAGE_KEY) {
      callback();
    }
  };

  const handleCustom = () => {
    callback();
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
    window.addEventListener(WISHLIST_EVENT, handleCustom);
  }

  return () => {
    memoryListeners = memoryListeners.filter((l) => l !== callback);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(WISHLIST_EVENT, handleCustom);
    }
  };
}

let cachedItems: string[] = [];
let cachedRaw: string | null = null;

function getSnapshot(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedItems = readStoredItems();
    }
  } catch {
    // Return last cached
  }
  return cachedItems;
}

function getServerSnapshot(): string[] {
  return [];
}

export function useWishlist() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const add = useCallback((productId: string) => {
    const current = readStoredItems();
    const store = createWishlistStore(current);
    store.add(productId);
    writeStoredItems(store.items());
  }, []);

  const remove = useCallback((productId: string) => {
    const current = readStoredItems();
    const store = createWishlistStore(current);
    store.remove(productId);
    writeStoredItems(store.items());
  }, []);

  const toggle = useCallback((productId: string) => {
    const current = readStoredItems();
    const store = createWishlistStore(current);
    const result = store.toggle(productId);
    writeStoredItems(store.items());
    return result;
  }, []);

  const clear = useCallback(() => {
    const store = createWishlistStore([]);
    store.clear();
    writeStoredItems([]);
  }, []);

  const has = useCallback(
    (productId: string) => {
      return items.includes(productId);
    },
    [items]
  );

  return {
    items,
    count: items.length,
    has,
    add,
    remove,
    toggle,
    clear,
    isHydrated,
    maxItems: WISHLIST_MAX_ITEMS,
  };
}
