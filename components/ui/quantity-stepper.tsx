/**
 * QuantityStepper — increment/decrement with min/max bounds.
 * Uses accessible button labels and aria-live for screen reader updates.
 */
'use client';

import * as React from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface QuantityStepperProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  className,
}: QuantityStepperProps) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  const btnClass = cn(
    'flex h-9 w-9 items-center justify-center rounded-card-sm border border-neutral-300',
    'text-neutral-700 transition-colors hover:bg-neutral-100 active:bg-neutral-200',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue',
    'disabled:opacity-40 disabled:cursor-not-allowed',
  );

  return (
    <div
      role="group"
      aria-label="Quantity"
      className={cn('inline-flex items-center gap-2', className)}
    >
      <button
        type="button"
        onClick={dec}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
        className={btnClass}
      >
        <Minus size={16} aria-hidden="true" />
      </button>

      <span
        aria-live="polite"
        aria-atomic="true"
        aria-label={`Quantity: ${value}`}
        className="min-w-[2.5rem] text-center text-sm font-semibold tabular-nums text-neutral-900"
      >
        {value}
      </span>

      <button
        type="button"
        onClick={inc}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
        className={btnClass}
      >
        <Plus size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
