/**
 * PriceTag — displays Naira prices correctly.
 * - currentNgn: integer Naira (authoritative price)
 * - oldNgn: optional; if provided, renders as strikethrough and shows discount %
 * Money is ALWAYS integer. Formatting only happens here at the UI edge.
 */
import * as React from 'react';
import { cn } from '@/lib/cn';
import { formatNgn } from '@/lib/money';

export interface PriceTagProps extends React.HTMLAttributes<HTMLDivElement> {
  currentNgn: number;
  oldNgn?: number;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { current: 'text-base font-bold', old: 'text-xs', badge: 'text-xs' },
  md: { current: 'text-xl font-bold', old: 'text-sm', badge: 'text-xs' },
  lg: { current: 'text-2xl font-bold', old: 'text-base', badge: 'text-sm' },
};

export function PriceTag({ currentNgn, oldNgn, size = 'md', className, ...props }: PriceTagProps) {
  const discount =
    oldNgn && oldNgn > currentNgn
      ? Math.round(((oldNgn - currentNgn) / oldNgn) * 100)
      : null;

  const s = sizeMap[size];

  return (
    <div className={cn('flex flex-wrap items-baseline gap-2', className)} {...props}>
      <span className={cn('text-neutral-900', s.current)}>{formatNgn(currentNgn)}</span>
      {oldNgn && oldNgn > currentNgn && (
        <span className={cn('text-neutral-500 line-through', s.old)}>{formatNgn(oldNgn)}</span>
      )}
      {discount !== null && (
        <span
          className={cn(
            'inline-flex items-center rounded-full bg-brand-dangerLight px-2 py-0.5 font-semibold text-brand-danger',
            s.badge,
          )}
        >
          -{discount}%
        </span>
      )}
    </div>
  );
}
