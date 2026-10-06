/**
 * StockBadge — communicates availability without leaking exact stock numbers.
 * Thresholds: 0 = Sold Out, 1-5 = Low Stock, >5 = In Stock.
 */
import * as React from 'react';
import { cn } from '@/lib/cn';

export type StockLevel = 'in-stock' | 'low-stock' | 'sold-out';

export interface StockBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  stock?: number;
  quantity?: number;
}

function getLevel(stock: number): StockLevel {
  if (stock <= 0) return 'sold-out';
  if (stock <= 5) return 'low-stock';
  return 'in-stock';
}

const labelMap: Record<StockLevel, string> = {
  'in-stock': 'In Stock',
  'low-stock': 'Low Stock',
  'sold-out': 'Sold Out',
};

const classMap: Record<StockLevel, string> = {
  'in-stock': 'bg-brand-successLight text-brand-success',
  'low-stock': 'bg-brand-warningLight text-brand-warning',
  'sold-out': 'bg-neutral-100 text-neutral-500',
};

export function StockBadge({ stock, quantity, className, ...props }: StockBadgeProps) {
  const count = stock !== undefined ? stock : quantity !== undefined ? quantity : 0;
  const level = getLevel(count);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        classMap[level],
        className,
      )}
      {...props}
    >
      <span
        className={cn('h-1.5 w-1.5 rounded-full', {
          'bg-brand-success': level === 'in-stock',
          'bg-brand-warning': level === 'low-stock',
          'bg-neutral-400': level === 'sold-out',
        })}
        aria-hidden="true"
      />
      {labelMap[level]}
    </span>
  );
}
