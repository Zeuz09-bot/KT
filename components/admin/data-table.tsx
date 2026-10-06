/**
 * DataTable — reusable accessible data table for admin catalogue, order, and customer lists.
 */
import * as React from 'react';
import { cn } from '@/lib/cn';
import { Skeleton } from '@/components/ui/skeleton';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'No records found.',
  onRowClick,
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn('w-full overflow-x-auto rounded-card-md border border-neutral-200 bg-neutral-0 shadow-sm', className)}>
      <table className="w-full text-left text-sm text-neutral-800">
        <thead className="bg-neutral-50 border-b border-neutral-200 text-xs uppercase font-semibold text-neutral-500">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  'px-4 py-3.5',
                  col.align === 'center' && 'text-center',
                  col.align === 'right' && 'text-right',
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, rIdx) => (
              <tr key={`skeleton-${rIdx}`}>
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-4">
                    <Skeleton variant="line" className="h-4 w-3/4" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-sm text-neutral-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={keyExtractor(row, idx)}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'transition-colors hover:bg-neutral-50/80',
                  onRowClick && 'cursor-pointer',
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 py-3.5 align-middle',
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right',
                      col.className,
                    )}
                  >
                    {col.render
                      ? col.render(row, idx)
                      : (row as Record<string, unknown>)[col.key] !== undefined
                        ? String((row as Record<string, unknown>)[col.key])
                        : null}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
