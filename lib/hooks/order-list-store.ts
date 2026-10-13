/**
 * Pure state logic for the Order List.
 * Testable without DOM or React.
 * Blueprint §9.5
 */
import {
  ORDER_LIST_MAX_LINES,
  ORDER_LIST_MAX_QTY,
  type ListLineInput,
} from '@/lib/contracts/list';

export { ORDER_LIST_MAX_LINES, ORDER_LIST_MAX_QTY };

export interface OrderListStore {
  items: () => ListLineInput[];
  add: (variantId: string) => void;
  remove: (variantId: string) => void;
  setQty: (variantId: string, qty: number) => void;
  clear: () => void;
  count: () => number;
  isFull: () => boolean;
}

export function createOrderListStore(initialItems: ListLineInput[] = []): OrderListStore {
  let list: ListLineInput[] = [];

  for (const item of initialItems) {
    if (list.length >= ORDER_LIST_MAX_LINES) break;
    const existing = list.find((i) => i.variantId === item.variantId);
    if (existing) {
      existing.qty = Math.min(ORDER_LIST_MAX_QTY, existing.qty + item.qty);
    } else {
      list.push({
        variantId: item.variantId,
        qty: Math.min(ORDER_LIST_MAX_QTY, Math.max(1, item.qty)),
      });
    }
  }

  return {
    items: () => [...list],

    add: (variantId: string) => {
      const existing = list.find((i) => i.variantId === variantId);
      if (existing) {
        if (existing.qty < ORDER_LIST_MAX_QTY) {
          existing.qty += 1;
        }
        return;
      }

      if (list.length >= ORDER_LIST_MAX_LINES) {
        return;
      }

      list.push({ variantId, qty: 1 });
    },

    remove: (variantId: string) => {
      list = list.filter((i) => i.variantId !== variantId);
    },

    setQty: (variantId: string, qty: number) => {
      const existing = list.find((i) => i.variantId === variantId);
      if (!existing) return;

      if (qty <= 0) {
        list = list.filter((i) => i.variantId !== variantId);
      } else {
        existing.qty = Math.min(ORDER_LIST_MAX_QTY, qty);
      }
    },

    clear: () => {
      list = [];
    },

    count: () => {
      return list.reduce((sum, item) => sum + item.qty, 0);
    },

    isFull: () => {
      return list.length >= ORDER_LIST_MAX_LINES;
    },
  };
}
