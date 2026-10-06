/**
 * Textarea — multiline version of Input with the same accessible pattern.
 */
import * as React from 'react';
import { cn } from '@/lib/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  id: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error, id, className, ...props }, ref) => {
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-neutral-800">
            {label}
            {props.required && <span className="ml-0.5 text-brand-danger" aria-hidden="true">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={
            [error && errorId, helperText && helperId].filter(Boolean).join(' ') || undefined
          }
          className={cn(
            'min-h-[100px] w-full resize-y rounded-card-sm border bg-neutral-0 px-3.5 py-2.5 text-sm text-neutral-900',
            'placeholder:text-neutral-500',
            'transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:border-brand-blue',
            error
              ? 'border-brand-danger focus-visible:ring-brand-danger'
              : 'border-neutral-300 hover:border-neutral-400',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-neutral-100',
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
Textarea.displayName = 'Textarea';
