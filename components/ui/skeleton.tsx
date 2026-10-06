/**
 * Skeleton — shimmer loading placeholders.
 * Variants: line (text), card (product card), image (square/rounded).
 */
import * as React from 'react';
import { cn } from '@/lib/cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'line' | 'card' | 'image' | 'circle';
  width?: string;
  height?: string;
}

export function Skeleton({
  variant = 'line',
  width,
  height,
  className,
  style,
  ...props
}: SkeletonProps) {
  const base = 'shimmer rounded overflow-hidden';

  const variantClass = {
    line: 'h-4 rounded',
    card: 'aspect-[3/4] w-full rounded-card-md',
    image: 'aspect-square w-full rounded-card-sm',
    circle: 'rounded-full',
  }[variant];

  return (
    <div
      aria-hidden="true"
      className={cn(base, variantClass, className)}
      style={{ width, height, ...style }}
      {...props}
    />
  );
}

/** Convenience wrapper for a product card skeleton */
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-card-md border border-neutral-200 bg-neutral-0 p-3">
      <Skeleton variant="image" />
      <div className="flex flex-col gap-2 p-1">
        <Skeleton variant="line" className="w-3/4" />
        <Skeleton variant="line" className="w-1/2 h-5" />
        <Skeleton variant="line" className="w-1/3 h-3" />
      </div>
    </div>
  );
}
