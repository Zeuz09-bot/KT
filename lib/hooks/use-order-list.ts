/**
 * useOrderList hook (U09)
 * Manages order list in localStorage ('krn:list:v1') with cross-tab and in-tab sync.
 * Blueprint §9.5, §10.3
 */
'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import {
  ORDER_LIST_STORAGE_KEY,
  type ListLineInput,
} from '@/lib/contracts/list';
import {
  createOrderListStore,
  ORDER_LIST_MAX_LINES,
  ORDER_LIST_MAX_QTY,
} from './order-list-store';

const ORDER_LIST_EVENT = 'krn:order-list-change';

function readStoredItems(): ListLineInput[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(ORDER_LIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item) => typeof item?.variantId === 'string' && typeof item?.qty === 'number'
      );
    }
  } catch {
    // In-memory fallback on quota or parse error
  }
  return [];
}

function writeStoredItems(items: ListLineInput[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ORDER_LIST_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(ORDER_LIST_EVENT));
  } catch {
    // Quota exceeded or private browsing restricted
  }
}

let memoryListeners: Array<() => void> = [];

function subscribe(callback: () => void) {
  memoryListeners.push(callback);

  const handleStorage = (e: StorageEvent) => {
    if (e.key === ORDER_LIST_STORAGE_KEY) {
      callback();
    }
  };

  const handleCustom = () => {
    callback();
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
    window.addEventListener(ORDER_LIST_EVENT, handleCustom);
  }

  return () => {
    memoryListeners = memoryListeners.filter((l) => l !== callback);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(ORDER_LIST_EVENT, handleCustom);
    }
  };
}

const EMPTY_ORDER_ITEMS: ListLineInput[] = [];
let cachedItems: ListLineInput[] = EMPTY_ORDER_ITEMS;
let cachedRaw: string | null = null;

function getSnapshot(): ListLineInput[] {
  if (typeof window === 'undefined') return EMPTY_ORDER_ITEMS;
  try {
    const raw = window.localStorage.getItem(ORDER_LIST_STORAGE_KEY);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedItems = readStoredItems();
    }
  } catch {
    // Return last cached
  }
  return cachedItems;
}

function getServerSnapshot(): ListLineInput[] {
  return EMPTY_ORDER_ITEMS;
}

export function useOrderList() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const add = useCallback((variantId: string) => {
    const current = readStoredItems();
    const store = createOrderListStore(current);
    store.add(variantId);
    writeStoredItems(store.items());
  }, []);

  const remove = useCallback((variantId: string) => {
    const current = readStoredItems();
    const store = createOrderListStore(current);
    store.remove(variantId);
    writeStoredItems(store.items());
  }, []);

  const setQty = useCallback((variantId: string, qty: number) => {
    const current = readStoredItems();
    const store = createOrderListStore(current);
    store.setQty(variantId, qty);
    writeStoredItems(store.items());
  }, []);

  const clear = useCallback(() => {
    const store = createOrderListStore([]);
    store.clear();
    writeStoredItems([]);
  }, []);

  const store = createOrderListStore(items);

  return {
    items,
    count: store.count(),
    isFull: store.isFull(),
    add,
    remove,
    setQty,
    clear,
    isHydrated,
    maxLines: ORDER_LIST_MAX_LINES,
    maxQty: ORDER_LIST_MAX_QTY,
  };
}
