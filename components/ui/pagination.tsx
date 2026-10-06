/**
 * Pagination — numbered page navigator.
 */
'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface PaginationProps {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function buildPages(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | 'ellipsis')[] = [1];
  if (current > 3) pages.push('ellipsis');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 2) pages.push('ellipsis');
  pages.push(total);
  return pages;
}

export function Pagination({ totalPages, currentPage, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;
  const pages = buildPages(currentPage, totalPages);

  const btnBase =
    'flex min-h-[36px] min-w-[36px] items-center justify-center rounded-card-sm text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue';

  return (
    <nav aria-label="Pagination" className={cn('flex items-center gap-1', className)}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Previous page"
        className={cn(btnBase, 'border border-neutral-300 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed')}
      >
        <ChevronLeft size={16} aria-hidden="true" />
      </button>

      {pages.map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`ellipsis-${i}`} className={cn(btnBase, 'cursor-default text-neutral-400')}>
            <MoreHorizontal size={16} aria-hidden="true" />
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            aria-label={`Page ${p}`}
            aria-current={p === currentPage ? 'page' : undefined}
            className={cn(
              btnBase,
              p === currentPage
                ? 'bg-brand-blue text-white'
                : 'border border-neutral-300 hover:bg-neutral-100',
            )}
          >
            {p}
          </button>
        ),
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Next page"
        className={cn(btnBase, 'border border-neutral-300 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed')}
      >
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </nav>
  );
}
