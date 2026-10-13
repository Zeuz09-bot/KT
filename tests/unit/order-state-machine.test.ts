/**
 * U11 — Order State Machine Tests
 * Verifies allowed status transitions, role enforcement (staff vs owner),
 * terminal states, and transition side effects declarations.
 * Blueprint §5.6, §9.2
 */
import { describe, it, expect } from 'vitest';
import {
  canTransition,
  getTransitionRule,
  allowedNextStatuses,
  TRANSITION_RULES,
  TERMINAL_STATUSES,
} from '../../modules/orders/transition';
import type { OrderStatus } from '../../lib/constants';

describe('Order State Machine (U11)', () => {
  describe('Allowed transitions per Blueprint §5.6', () => {
    it('allows staff and owner to move new -> confirmed', () => {
      expect(canTransition('new', 'confirmed', 'staff')).toBe(true);
      expect(canTransition('new', 'confirmed', 'owner')).toBe(true);
    });

    it('allows staff and owner to move new -> cancelled', () => {
      expect(canTransition('new', 'cancelled', 'staff')).toBe(true);
      expect(canTransition('new', 'cancelled', 'owner')).toBe(true);
    });

    it('allows staff and owner to move confirmed -> paid', () => {
      expect(canTransition('confirmed', 'paid', 'staff')).toBe(true);
      expect(canTransition('confirmed', 'paid', 'owner')).toBe(true);
    });

    it('allows staff and owner to move confirmed -> cancelled', () => {
      expect(canTransition('confirmed', 'cancelled', 'staff')).toBe(true);
      expect(canTransition('confirmed', 'cancelled', 'owner')).toBe(true);
    });

    it('allows staff and owner to move paid -> processing', () => {
      expect(canTransition('paid', 'processing', 'staff')).toBe(true);
      expect(canTransition('paid', 'processing', 'owner')).toBe(true);
    });

    it('allows OWNER ONLY to cancel a paid order', () => {
      expect(canTransition('paid', 'cancelled', 'staff')).toBe(false);
      expect(canTransition('paid', 'cancelled', 'owner')).toBe(true);
    });

    it('allows staff and owner to move processing -> shipped', () => {
      expect(canTransition('processing', 'shipped', 'staff')).toBe(true);
      expect(canTransition('processing', 'shipped', 'owner')).toBe(true);
    });

    it('allows OWNER ONLY to cancel a processing order', () => {
      expect(canTransition('processing', 'cancelled', 'staff')).toBe(false);
      expect(canTransition('processing', 'cancelled', 'owner')).toBe(true);
    });

    it('allows staff and owner to move shipped -> delivered', () => {
      expect(canTransition('shipped', 'delivered', 'staff')).toBe(true);
      expect(canTransition('shipped', 'delivered', 'owner')).toBe(true);
    });
  });

  describe('Disallowed & backward transitions', () => {
    it('disallows skipping steps (new -> paid, new -> delivered, confirmed -> shipped)', () => {
      expect(canTransition('new', 'paid', 'owner')).toBe(false);
      expect(canTransition('new', 'delivered', 'owner')).toBe(false);
      expect(canTransition('confirmed', 'shipped', 'owner')).toBe(false);
    });

    it('disallows backward transitions (shipped -> processing, paid -> confirmed)', () => {
      expect(canTransition('shipped', 'processing', 'owner')).toBe(false);
      expect(canTransition('paid', 'confirmed', 'owner')).toBe(false);
      expect(canTransition('confirmed', 'new', 'owner')).toBe(false);
    });

    it('disallows self-transitions (confirmed -> confirmed)', () => {
      expect(canTransition('confirmed', 'confirmed', 'owner')).toBe(false);
      expect(canTransition('paid', 'paid', 'owner')).toBe(false);
    });

    it('disallows any transition from terminal states (delivered, cancelled)', () => {
      for (const terminal of TERMINAL_STATUSES) {
        const statuses: OrderStatus[] = ['new', 'confirmed', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
        for (const target of statuses) {
          expect(canTransition(terminal, target, 'owner')).toBe(false);
          expect(canTransition(terminal, target, 'staff')).toBe(false);
        }
      }
    });
  });

  describe('allowedNextStatuses helper', () => {
    it('returns correct targets for staff vs owner on paid status', () => {
      const staffTargets = allowedNextStatuses('paid', 'staff');
      expect(staffTargets).toEqual(['processing']);

      const ownerTargets = allowedNextStatuses('paid', 'owner');
      expect(ownerTargets).toEqual(['processing', 'cancelled']);
    });

    it('returns empty array for terminal statuses', () => {
      expect(allowedNextStatuses('delivered', 'owner')).toEqual([]);
      expect(allowedNextStatuses('cancelled', 'owner')).toEqual([]);
      expect(allowedNextStatuses('delivered', 'staff')).toEqual([]);
    });

    it('returns confirmed and cancelled for new', () => {
      expect(allowedNextStatuses('new', 'staff')).toEqual(['confirmed', 'cancelled']);
    });
  });

  describe('Transition side effects declarations', () => {
    it('declares deduct_stock when moving new -> confirmed', () => {
      const rule = getTransitionRule('new', 'confirmed');
      expect(rule).not.toBeNull();
      expect(rule?.effects).toContain('deduct_stock');
    });

    it('declares restore_stock when cancelling confirmed, paid, or processing orders', () => {
      expect(getTransitionRule('confirmed', 'cancelled')?.effects).toContain('restore_stock');
      expect(getTransitionRule('paid', 'cancelled')?.effects).toContain('restore_stock');
      expect(getTransitionRule('processing', 'cancelled')?.effects).toContain('restore_stock');
    });

    it('does NOT restore stock when cancelling new order (stock was never deducted)', () => {
      const rule = getTransitionRule('new', 'cancelled');
      expect(rule).not.toBeNull();
      expect(rule?.effects).not.toContain('restore_stock');
    });

    it('declares payment requirement on confirmed -> paid', () => {
      const rule = getTransitionRule('confirmed', 'paid');
      expect(rule).not.toBeNull();
      expect(rule?.required).toContain('paymentAmount');
      expect(rule?.effects).toContain('set_payment');
    });
  });
});
