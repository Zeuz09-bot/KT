/**
 * SectionHeader — standard homepage section heading with optional "View all" link.
 */
import * as React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
}

export function SectionHeader({
  title,
  subtitle,
  viewAllHref,
  viewAllLabel = 'View all',
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between', className)} {...props}>
      <div>
        <h2 className="text-xl font-bold text-neutral-900 sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-1 text-xs text-neutral-500">{subtitle}</p>}
      </div>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-blue hover:underline underline-offset-2 transition-colors"
        >
          {viewAllLabel}
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
