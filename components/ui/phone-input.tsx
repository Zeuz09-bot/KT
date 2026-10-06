/**
 * PhoneInput — Nigerian phone number input.
 * Displays a fixed +234 prefix, accepts 0803... / 803... / +234803... formats.
 * Emits the raw value; normalisation to E.164 happens on the server.
 */
'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

export interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  id: string;
  label?: string;
  error?: string;
  helperText?: string;
  value?: string;
  onChange?: (raw: string) => void;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ id, label, error, helperText, value = '', onChange, className, ...props }, ref) => {
    const errorId = `${id}-error`;
    const helperId = `${id}-hint`;

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      // Allow digits, spaces, and dashes only
      const cleaned = e.target.value.replace(/[^\d\s-]/g, '');
      onChange?.(cleaned);
    }

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-neutral-800">
            {label}
            {props.required && (
              <span className="ml-0.5 text-brand-danger" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <div className="flex">
          {/* Fixed country prefix */}
          <span
            aria-hidden="true"
            className={cn(
              'flex min-h-[44px] items-center rounded-l-card-sm border border-r-0 bg-neutral-100 px-3 text-sm font-medium text-neutral-600',
              error ? 'border-brand-danger' : 'border-neutral-300',
            )}
          >
            +234
          </span>
          <input
            ref={ref}
            id={id}
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={value}
            onChange={handleChange}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            placeholder="0803 123 4567"
            className={cn(
              'min-h-[44px] w-full rounded-r-card-sm border bg-neutral-0 px-3.5 py-2.5 text-sm text-neutral-900',
              'placeholder:text-neutral-500',
              'transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:border-brand-blue',
              error
                ? 'border-brand-danger focus-visible:ring-brand-danger'
                : 'border-neutral-300 hover:border-neutral-400',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              className,
            )}
            {...props}
          />
        </div>
        {error ? (
          <p id={errorId} role="alert" className="text-xs text-brand-danger">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-xs text-neutral-500">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);
PhoneInput.displayName = 'PhoneInput';
