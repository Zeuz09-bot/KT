/**
 * Countdown — displays time remaining until a server-provided endsAt Date.
 * Returns null when endsAt is null or in the past.
 * Stops animation on prefers-reduced-motion (CSS handles this globally).
 */
'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

export interface CountdownProps extends React.HTMLAttributes<HTMLDivElement> {
  endsAt: Date | null;
  label?: string;
}

function computeRemaining(endsAt: Date): { h: number; m: number; s: number } | null {
  const diff = endsAt.getTime() - Date.now();
  if (diff <= 0) return null;
  const totalSec = Math.floor(diff / 1000);
  return {
    h: Math.floor(totalSec / 3600),
    m: Math.floor((totalSec % 3600) / 60),
    s: totalSec % 60,
  };
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

export function Countdown({ endsAt, label = 'Ends in', className, ...props }: CountdownProps) {
  const [remaining, setRemaining] = React.useState<{ h: number; m: number; s: number } | null>(
    endsAt ? computeRemaining(endsAt) : null,
  );

  React.useEffect(() => {
    if (!endsAt) return;
    const tick = () => setRemaining(computeRemaining(endsAt));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (!endsAt || !remaining) return null;

  return (
    <div
      className={cn('flex items-center gap-2 text-sm font-medium', className)}
      aria-live="off" // Not announced every second; screen readers can read on demand
      {...props}
    >
      <span className="text-neutral-600">{label}</span>
      <span className="tabular-nums font-bold text-brand-danger">
        {pad(remaining.h)}:{pad(remaining.m)}:{pad(remaining.s)}
      </span>
    </div>
  );
}
