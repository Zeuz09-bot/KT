/**
 * FormField — wrapper for admin and general form controls with accessible labelling, errors, and hints.
 */
import * as React from 'react';
import { cn } from '@/lib/cn';

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  id?: string;
  label?: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  badge?: string;
}

export function FormField({
  id,
  label,
  required,
  helperText,
  error,
  badge,
  className,
  children,
  ...props
}: FormFieldProps) {
  const helperId = id && helperText ? `${id}-hint` : undefined;
  const errorId = id && error ? `${id}-error` : undefined;

  return (
    <div className={cn('space-y-1.5', className)} {...props}>
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="text-sm font-medium text-neutral-800">
            {label}
            {required && <span className="ml-1 text-state-error" aria-hidden="true">*</span>}
          </label>
          {badge && (
            <span className="text-xs text-neutral-500 font-normal">{badge}</span>
          )}
        </div>
      )}

      {children}

      {error ? (
        <p id={errorId} role="alert" className="text-xs text-state-error font-medium">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-neutral-500">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
