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
  | 'success'
  | 'champagne'
  | 'silver';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  new: 'bg-brand-navy text-brand-white border border-brand-silver/30 font-display tracking-display',
  bestseller: 'bg-brand-charcoal text-brand-white border border-brand-silver/30 font-display tracking-display',
  champagne: 'bg-brand-champagne/20 text-brand-charcoal border border-brand-champagne/40 font-medium',
  silver: 'bg-brand-silver/30 text-brand-navy border border-brand-silver/60 font-medium',
  discount: 'bg-brand-danger text-white font-medium',
  lowstock: 'bg-brand-warningLight text-neutral-900 border border-brand-warning/30 font-medium',
  soldout: 'bg-neutral-400 text-white font-medium',
  generic: 'bg-brand-cream text-brand-charcoal border border-brand-silver/40 font-medium',
  info: 'bg-brand-cream text-brand-navy border border-brand-silver/30 font-medium',
  success: 'bg-brand-successLight text-brand-success border border-brand-success/30 font-medium',
};

const defaultLabels: Partial<Record<BadgeVariant, string>> = {
  new: 'New',
  bestseller: 'Best Seller',
  champagne: 'Prestige',
  silver: 'Certified',
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
