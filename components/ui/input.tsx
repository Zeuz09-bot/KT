/**
 * Input — styled text input with label, helper text, and error state.
 */
import * as React from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  /** Unique id required for accessible label binding */
  id: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, id, className, ...props }, ref) => {
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-display font-medium text-brand-charcoal">
            {label}
            {props.required && <span className="ml-0.5 text-brand-danger" aria-hidden="true">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={
            [error && errorId, helperText && helperId].filter(Boolean).join(' ') || undefined
          }
          className={cn(
            'min-h-[44px] w-full rounded-card-sm border bg-brand-white px-3.5 py-2.5 text-sm text-brand-charcoal font-sans',
            'placeholder:text-brand-charcoal/40',
            'transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy focus-visible:border-brand-navy',
            error
              ? 'border-brand-danger focus-visible:ring-brand-danger'
              : 'border-brand-silver/70 hover:border-brand-navy/40',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-brand-cream/50',
            className,
          )}
          {...props}
        />
        {error && (
          <p id={errorId} role="alert" className="text-xs text-brand-danger">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="text-xs text-neutral-500">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';
