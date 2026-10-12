/**
 * PaginationNav — URL-driven pagination wrapper (U08)
 * Wraps the Pagination UI component and uses router to navigate pages.
 */
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { Pagination } from '@/components/ui/pagination';

interface PaginationNavProps {
  currentPage: number;
  totalPages: number;
}

export function PaginationNav({ currentPage, totalPages }: PaginationNavProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const handlePageChange = (page: number) => {
    const next = new URLSearchParams(params.toString());
    if (page === 1) {
      next.delete('page');
    } else {
      next.set('page', String(page));
    }
    startTransition(() => {
      router.push(`?${next.toString()}`, { scroll: true });
    });
  };

  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={handlePageChange}
    />
  );
}
