/**
 * Badge — small status/label chips on product cards and elsewhere.
 * Variants: new, bestseller, discount, lowstock, soldout, generic.
 */
import * as React from 'react';
import { cn } from '@/lib/cn';

export type BadgeVariant =
  | 'new'
  | 'bestseller'
  | 'discount'
  | 'lowstock'
  | 'soldout'
  | 'generic'
  | 'info'
  | 'success';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  new: 'bg-brand-blue text-white',
  bestseller: 'bg-brand-navy text-white',
  discount: 'bg-brand-danger text-white',
  lowstock: 'bg-brand-warning text-neutral-900',
  soldout: 'bg-neutral-400 text-white',
  generic: 'bg-neutral-100 text-neutral-800 border border-neutral-200',
  info: 'bg-brand-blueLight text-brand-blue',
  success: 'bg-brand-successLight text-brand-success',
};

const defaultLabels: Partial<Record<BadgeVariant, string>> = {
  new: 'New',
  bestseller: 'Best Seller',
  discount: 'Sale',
  lowstock: 'Low Stock',
  soldout: 'Sold Out',
  generic: 'Featured',
  info: 'Info',
  success: 'Success',
};

export function Badge({ variant = 'info', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold leading-none',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children ?? defaultLabels[variant]}
    </span>
  );
}
