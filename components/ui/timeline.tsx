/**
 * Timeline — order status progress for the Track page.
 * Renders completed steps in brand-blue, current step highlighted, future steps grey.
 */
import * as React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface TimelineStep {
  label: string;
  description?: string;
  timestamp?: string; // pre-formatted Africa/Lagos display string
  status: 'done' | 'current' | 'upcoming';
}

export interface TimelineProps extends React.HTMLAttributes<HTMLOListElement> {
  steps: TimelineStep[];
}

export function Timeline({ steps, className, ...props }: TimelineProps) {
  return (
    <ol className={cn('relative flex flex-col gap-0', className)} role="list" {...props}>
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        return (
          <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
            {/* Vertical connector */}
            {!isLast && (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute left-[11px] top-6 h-full w-0.5',
                  step.status === 'done' ? 'bg-brand-blue' : 'bg-neutral-200',
                )}
              />
            )}

            {/* Icon */}
            <div className="relative z-10 shrink-0">
              {step.status === 'done' ? (
                <CheckCircle2
                  size={24}
                  className="text-brand-blue"
                  aria-hidden="true"
                />
              ) : step.status === 'current' ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-brand-blue bg-brand-blueLight">
                  <span className="h-2 w-2 rounded-full bg-brand-blue" aria-hidden="true" />
                </div>
              ) : (
                <Circle size={24} className="text-neutral-300" aria-hidden="true" />
              )}
            </div>

            {/* Content */}
            <div className="min-w-0">
              <p
                className={cn(
                  'text-sm font-semibold',
                  step.status === 'upcoming' ? 'text-neutral-400' : 'text-neutral-900',
                )}
              >
                {step.label}
              </p>
              {step.description && (
                <p className="mt-0.5 text-xs text-neutral-500">{step.description}</p>
              )}
              {step.timestamp && (
                <time className="mt-0.5 block text-xs text-neutral-400">{step.timestamp}</time>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
