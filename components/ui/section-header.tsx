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
  editorial?: boolean;
}

export function SectionHeader({
  title,
  subtitle,
  viewAllHref,
  viewAllLabel = 'View all',
  editorial = false,
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div className={cn('flex items-end justify-between border-b border-brand-silver/30 pb-4', className)} {...props}>
      <div>
        <h2
          className={cn(
            'text-xl font-bold text-brand-charcoal sm:text-2xl tracking-display',
            editorial ? 'font-editorial uppercase tracking-editorial text-brand-navy' : 'font-display',
          )}
        >
          {title}
        </h2>
        {subtitle && <p className="mt-1.5 text-xs text-brand-charcoal/60 tracking-wide">{subtitle}</p>}
      </div>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-display font-medium text-brand-navy hover:text-brand-charcoal transition-colors group"
        >
          <span>{viewAllLabel}</span>
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
