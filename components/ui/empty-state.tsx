/**
 * EmptyState — zero-results or placeholder content.
 */
import * as React from 'react';
import { cn } from '@/lib/cn';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, message, action, className, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-3 py-16 text-center', className)}
      {...props}
    >
      {icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
      {message && <p className="max-w-xs text-sm text-neutral-500">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
