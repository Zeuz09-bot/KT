/**
 * U09 — useOrderList hook tests
 * Pure logic: no DOM, no fetch. Tests all business rules from blueprint §9.5.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createOrderListStore,
  type OrderListStore,
  ORDER_LIST_MAX_LINES,
  ORDER_LIST_MAX_QTY,
} from '../../lib/hooks/order-list-store';

// createOrderListStore is the pure in-memory logic extracted from the hook
// so we can test it without localStorage/React

let store: OrderListStore;

beforeEach(() => {
  store = createOrderListStore([]);
});

describe('add', () => {
  it('adds a new item with qty 1', () => {
    store.add('v1');
    expect(store.items()).toEqual([{ variantId: 'v1', qty: 1 }]);
  });

  it('increments qty when adding the same variant again', () => {
    store.add('v1');
    store.add('v1');
    expect(store.items()).toEqual([{ variantId: 'v1', qty: 2 }]);
  });

  it('does not exceed max qty per line', () => {
    for (let i = 0; i <= ORDER_LIST_MAX_QTY + 2; i++) {
      store.add('v1');
    }
    expect(store.items()[0].qty).toBe(ORDER_LIST_MAX_QTY);
  });

  it('does not exceed max lines', () => {
    for (let i = 0; i < ORDER_LIST_MAX_LINES + 5; i++) {
      store.add(`v${i}`);
    }
    expect(store.items().length).toBe(ORDER_LIST_MAX_LINES);
  });

  it('returns isFull true when at max lines', () => {
    for (let i = 0; i < ORDER_LIST_MAX_LINES; i++) {
      store.add(`v${i}`);
    }
    expect(store.isFull()).toBe(true);
  });

  it('still increments qty on existing item when list is full', () => {
    for (let i = 0; i < ORDER_LIST_MAX_LINES; i++) {
      store.add(`v${i}`);
    }
    store.add('v0'); // existing — should increment
    expect(store.items()[0].qty).toBe(2);
  });
});

describe('remove', () => {
  it('removes the item', () => {
    store.add('v1');
    store.add('v2');
    store.remove('v1');
    expect(store.items()).toEqual([{ variantId: 'v2', qty: 1 }]);
  });

  it('is a no-op for unknown variantId', () => {
    store.add('v1');
    store.remove('v999');
    expect(store.items().length).toBe(1);
  });
});

describe('setQty', () => {
  it('sets qty to the given value', () => {
    store.add('v1');
    store.setQty('v1', 3);
    expect(store.items()[0].qty).toBe(3);
  });

  it('clamps qty to max', () => {
    store.add('v1');
    store.setQty('v1', 99);
    expect(store.items()[0].qty).toBe(ORDER_LIST_MAX_QTY);
  });

  it('removes item if qty set to 0', () => {
    store.add('v1');
    store.setQty('v1', 0);
    expect(store.items().length).toBe(0);
  });

  it('is a no-op for unknown variantId', () => {
    store.add('v1');
    store.setQty('v999', 2);
    expect(store.items()).toEqual([{ variantId: 'v1', qty: 1 }]);
  });
});

describe('clear', () => {
  it('removes all items', () => {
    store.add('v1');
    store.add('v2');
    store.clear();
    expect(store.items()).toEqual([]);
  });
});

describe('count', () => {
  it('returns total quantity across all lines', () => {
    store.add('v1');
    store.add('v1');
    store.add('v2');
    expect(store.count()).toBe(3);
  });

  it('returns 0 for empty list', () => {
    expect(store.count()).toBe(0);
  });
});

describe('initialisation', () => {
  it('can be initialised with existing items', () => {
    const prefilled = createOrderListStore([
      { variantId: 'v1', qty: 2 },
      { variantId: 'v2', qty: 1 },
    ]);
    expect(prefilled.count()).toBe(3);
  });

  it('clamps initial qty that exceeds max', () => {
    const s = createOrderListStore([{ variantId: 'v1', qty: 99 }]);
    expect(s.items()[0].qty).toBe(ORDER_LIST_MAX_QTY);
  });

  it('trims initial items that exceed max lines', () => {
    const items = Array.from({ length: 15 }, (_, i) => ({
      variantId: `v${i}`,
      qty: 1,
    }));
    const s = createOrderListStore(items);
    expect(s.items().length).toBe(ORDER_LIST_MAX_LINES);
  });
});
