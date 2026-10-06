/**
 * StatusPill — visual badge for order and entity status in admin and order tracking.
 */
import * as React from 'react';
import { cn } from '@/lib/cn';
import { OrderStatus, CUSTOMER_STATUS_LABELS } from '@/lib/constants';

export type StatusPillVariant = OrderStatus | 'active' | 'draft' | 'archived' | 'out_of_stock';

export interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusPillVariant;
  label?: string;
  size?: 'sm' | 'md';
}

const STATUS_CONFIGS: Record<
  StatusPillVariant,
  { label: string; bg: string; text: string; dot: string }
> = {
  new: {
    label: 'New Order',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
  confirmed: {
    label: 'Confirmed',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    dot: 'bg-purple-500',
  },
  paid: {
    label: 'Paid',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  processing: {
    label: 'Processing',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    dot: 'bg-amber-500',
  },
  shipped: {
    label: 'Shipped',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    dot: 'bg-indigo-500',
  },
  delivered: {
    label: 'Delivered',
    bg: 'bg-green-50',
    text: 'text-green-700',
    dot: 'bg-green-500',
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
  active: {
    label: 'Active',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  draft: {
    label: 'Draft',
    bg: 'bg-neutral-100',
    text: 'text-neutral-700',
    dot: 'bg-neutral-400',
  },
  archived: {
    label: 'Archived',
    bg: 'bg-neutral-200',
    text: 'text-neutral-600',
    dot: 'bg-neutral-500',
  },
  out_of_stock: {
    label: 'Out of Stock',
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
};

export function StatusPill({
  status,
  label,
  size = 'md',
  className,
  ...props
}: StatusPillProps) {
  const config = STATUS_CONFIGS[status] ?? {
    label: status,
    bg: 'bg-neutral-100',
    text: 'text-neutral-700',
    dot: 'bg-neutral-400',
  };

  const displayLabel = label ?? (CUSTOMER_STATUS_LABELS[status as OrderStatus] || config.label);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        config.bg,
        config.text,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        className,
      )}
      {...props}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', config.dot)} aria-hidden="true" />
      {displayLabel}
    </span>
  );
}
