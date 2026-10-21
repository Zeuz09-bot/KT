/**
 * Button — primary interaction component.
 * Variants: primary, secondary, ghost, whatsapp, icon.
 * Supports loading state and asChild (renders as any element via Radix Slot).
 */
'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'whatsapp' | 'icon' | 'editorial';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  isLoading?: boolean;
  /** Render as child element (e.g. a Next.js Link) */
  asChild?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-navy text-brand-white border border-brand-silver/20 hover:bg-brand-charcoal active:bg-brand-charcoal shadow-card',
  secondary:
    'bg-brand-white text-brand-charcoal border border-brand-silver/60 hover:bg-brand-cream active:bg-brand-silver/30 shadow-sm',
  ghost:
    'bg-transparent text-brand-navy hover:bg-brand-cream active:bg-brand-cream/80',
  whatsapp:
    'bg-brand-whatsapp text-brand-charcoal hover:bg-brand-whatsappDark active:bg-brand-whatsappDark font-semibold shadow-sm',
  editorial:
    'bg-brand-champagne/15 text-brand-charcoal border border-brand-champagne/50 hover:bg-brand-champagne/25 active:bg-brand-champagne/30 font-display tracking-display',
  icon: 'bg-transparent text-brand-charcoal/80 hover:bg-brand-cream active:bg-brand-silver/20 p-0',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-sm rounded-card-sm',
  md: 'h-11 px-5 text-sm rounded-card-sm',
  lg: 'h-12 px-6 text-base rounded-card-md',
  icon: 'h-9 w-9 p-0 rounded-card-sm',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      isLoading = false,
      asChild = false,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const isBusy = Boolean(loading || isLoading);
    const isDisabled = Boolean(disabled || isBusy);
    if (asChild) {
      return (
        <Slot
          ref={ref}
          aria-busy={isBusy || undefined}
          className={cn(
            // Base
            'inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150',
            'min-h-[44px] min-w-[44px]', // tap target
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
            variant !== 'icon' && sizeClasses[size],
            variantClasses[variant],
            className,
          )}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={isBusy || undefined}
        className={cn(
          // Base
          'inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150',
          'min-h-[44px] min-w-[44px]', // tap target
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          variant !== 'icon' && sizeClasses[size],
          variantClasses[variant],
          className,
        )}
        {...props}
      >
        {isBusy && (
          <span role="status" className="inline-flex items-center">
            <Loader2
              className="h-4 w-4 animate-spin shrink-0"
              aria-hidden="true"
            />
            <span className="sr-only">Loading...</span>
          </span>
        )}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';
