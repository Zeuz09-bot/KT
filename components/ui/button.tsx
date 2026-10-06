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

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'whatsapp' | 'icon';
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
    'bg-brand-blue text-white hover:bg-brand-blueDark active:bg-brand-blueDark shadow-sm',
  secondary:
    'bg-neutral-100 text-neutral-900 border border-neutral-300 hover:bg-neutral-200 active:bg-neutral-200',
  ghost:
    'bg-transparent text-brand-blue hover:bg-brand-blueLight active:bg-brand-blueLight',
  whatsapp:
    'bg-brand-whatsapp text-neutral-900 hover:bg-brand-whatsappDark active:bg-brand-whatsappDark font-semibold',
  icon: 'bg-transparent text-neutral-700 hover:bg-neutral-100 active:bg-neutral-100 p-0',
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
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
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
      </Comp>
    );
  },
);
Button.displayName = 'Button';
