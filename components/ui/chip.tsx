/**
 * Chip — selectable variant option (storage, colour, condition).
 * Used in the variant picker on product detail pages.
 */
'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  disabled?: boolean;
}

export function Chip({ selected = false, disabled = false, className, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      className={cn(
        'inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-card-sm border px-3 py-1.5 text-sm font-medium transition-colors duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue',
        selected
          ? 'border-brand-blue bg-brand-blueLight text-brand-blue'
          : 'border-neutral-300 bg-neutral-0 text-neutral-700 hover:border-brand-blue hover:text-brand-blue',
        disabled && 'opacity-40 cursor-not-allowed line-through',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
