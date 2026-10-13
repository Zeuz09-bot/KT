/**
 * Order State Machine (U11)
 * Pure, DB-free transition rules — the single source of truth for allowed moves.
 * Blueprint §5.6, §9.2
 */

import type { OrderStatus } from '@/lib/constants';

export type AdminRole = 'owner' | 'staff';

/** Who can perform each target transition */
export type TransitionRole = 'any' | 'owner_only';

export interface TransitionRule {
  from: OrderStatus;
  to: OrderStatus;
  role: TransitionRole;
  /** Required payload keys that must be supplied by the caller */
  required: string[];
  /** DB side-effects the RPC will apply */
  effects: ('deduct_stock' | 'restore_stock' | 'set_payment' | 'set_timestamps')[];
}

/**
 * All valid transitions per Blueprint §5.6.
 * Note: the Postgres RPC enforces these too — this file lets us test them in JS.
 */
export const TRANSITION_RULES: TransitionRule[] = [
  { from: 'new',        to: 'confirmed',  role: 'any',        required: [],                effects: ['deduct_stock', 'set_timestamps'] },
  { from: 'new',        to: 'cancelled',  role: 'any',        required: ['reason'],        effects: ['set_timestamps'] },
  { from: 'confirmed',  to: 'paid',       role: 'any',        required: ['paymentAmount'], effects: ['set_payment', 'set_timestamps'] },
  { from: 'confirmed',  to: 'cancelled',  role: 'any',        required: ['reason'],        effects: ['restore_stock', 'set_timestamps'] },
  { from: 'paid',       to: 'processing', role: 'any',        required: [],                effects: ['set_timestamps'] },
  { from: 'paid',       to: 'cancelled',  role: 'owner_only', required: ['reason'],        effects: ['restore_stock', 'set_timestamps'] },
  { from: 'processing', to: 'shipped',    role: 'any',        required: [],                effects: ['set_timestamps'] },
  { from: 'processing', to: 'cancelled',  role: 'owner_only', required: ['reason'],        effects: ['restore_stock', 'set_timestamps'] },
  { from: 'shipped',    to: 'delivered',  role: 'any',        required: [],                effects: ['set_timestamps'] },
];

/** Terminal statuses — no further transitions allowed */
export const TERMINAL_STATUSES: OrderStatus[] = ['delivered', 'cancelled'];

/**
 * Returns true if the transition is permitted for the given role.
 * Does NOT check DB state — just validates the rule table.
 */
export function canTransition(
  from: OrderStatus,
  to: OrderStatus,
  role: AdminRole,
): boolean {
  if (TERMINAL_STATUSES.includes(from)) return false;
  const rule = TRANSITION_RULES.find((r) => r.from === from && r.to === to);
  if (!rule) return false;
  if (rule.role === 'owner_only' && role !== 'owner') return false;
  return true;
}

/**
 * Returns the rule for a given transition, or null if not found/allowed.
 */
export function getTransitionRule(
  from: OrderStatus,
  to: OrderStatus,
): TransitionRule | null {
  return TRANSITION_RULES.find((r) => r.from === from && r.to === to) ?? null;
}

/**
 * Returns the list of target statuses a given role can transition to from `from`.
 */
export function allowedNextStatuses(
  from: OrderStatus,
  role: AdminRole,
): OrderStatus[] {
  if (TERMINAL_STATUSES.includes(from)) return [];
  return TRANSITION_RULES.filter(
    (r) => r.from === from && (r.role === 'any' || role === 'owner'),
  ).map((r) => r.to);
}
