'use client';

import React, { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, Download, RotateCcw, Calendar, Truck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { exportOrdersCsvAction } from '@/modules/orders/actions';
import type { OrderStatus } from '@/lib/constants';

interface OrderFiltersProps {
  currentStatus?: string;
  currentFulfilment?: string;
  currentSearch?: string;
  currentDateFrom?: string;
  currentDateTo?: string;
  isOwner?: boolean;
}

const ALL_STATUSES: { id: OrderStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'All Statuses' },
  { id: 'new', label: 'New' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'paid', label: 'Paid' },
  { id: 'processing', label: 'Processing' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

export function OrderFilters({
  currentStatus = 'all',
  currentFulfilment = 'all',
  currentSearch = '',
  currentDateFrom = '',
  currentDateTo = '',
  isOwner = false,
}: OrderFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(currentSearch);
  const [status, setStatus] = useState(currentStatus);
  const [fulfilment, setFulfilment] = useState(currentFulfilment);
  const [dateFrom, setDateFrom] = useState(currentDateFrom);
  const [dateTo, setDateTo] = useState(currentDateTo);
  const [isExporting, setIsExporting] = useState(false);

  function applyFilters(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1'); // Reset to page 1 on filter change

    for (const [key, val] of Object.entries(updates)) {
      if (!val || val === 'all') {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    }

    startTransition(() => {
      router.push(`/admin/orders?${params.toString()}`);
    });
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    applyFilters({ search: search.trim() });
  }

  function handleReset() {
    setSearch('');
    setStatus('all');
    setFulfilment('all');
    setDateFrom('');
    setDateTo('');
    startTransition(() => {
      router.push('/admin/orders');
    });
  }

  async function handleExportCsv() {
    if (!dateFrom || !dateTo) {
      toast({
        title: 'Date range required',
        description: 'Please select both From and To dates to export CSV.',
        variant: 'error',
      });
      return;
    }

    setIsExporting(true);
    try {
      const res = await exportOrdersCsvAction(dateFrom, dateTo);
      if (!res.ok) {
        toast({
          title: 'Export failed',
          description: res.error.message,
          variant: 'error',
        });
        return;
      }

      // Download CSV in browser
      const blob = new Blob([res.data.csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `keraunous-orders-${dateFrom}-to-${dateTo}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Export ready',
        description: 'Orders CSV downloaded successfully.',
        variant: 'success',
      });
    } catch {
      toast({
        title: 'Export error',
        description: 'Could not export orders CSV.',
        variant: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="bg-neutral-0 rounded-card-md border border-neutral-200 p-4 space-y-4 shadow-sm">
      {/* Top row: Search input + Actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            id="order-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID (KRN-...), customer, or phone..."
            className="pl-9 pr-20 h-10 text-sm"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-semibold bg-neutral-900 text-white rounded hover:bg-neutral-800 transition-colors"
          >
            Find
          </button>
        </form>

        <div className="flex items-center gap-2 flex-wrap">
          {isOwner && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleExportCsv}
              disabled={isExporting}
              isLoading={isExporting}
              className="gap-1.5 text-xs font-medium"
              title="Export filtered date range to CSV"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="gap-1.5 text-xs text-neutral-600 hover:text-neutral-900"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </div>

      {/* Status pills selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
          <Filter className="h-3 w-3" /> Status:
        </span>
        {ALL_STATUSES.map((item) => {
          const isSelected = status === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setStatus(item.id);
                applyFilters({ status: item.id });
              }}
              className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                isSelected
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Date & Fulfilment filters */}
      <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-neutral-100 text-xs">
        {/* Fulfilment Toggle */}
        <div className="flex items-center gap-1.5">
          <Truck className="h-3.5 w-3.5 text-neutral-500" />
          <span className="text-neutral-600 font-medium">Fulfilment:</span>
          <select
            value={fulfilment}
            onChange={(e) => {
              setFulfilment(e.target.value);
              applyFilters({ fulfilment: e.target.value });
            }}
            className="border border-neutral-300 rounded px-2 py-1 text-xs bg-white text-neutral-800 focus:outline-none focus:ring-1 focus:ring-brand-blue"
          >
            <option value="all">All types</option>
            <option value="delivery">Delivery</option>
            <option value="pickup">Pickup</option>
          </select>
        </div>

        {/* Date From */}
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-neutral-500" />
          <span className="text-neutral-600 font-medium">From:</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              applyFilters({ dateFrom: e.target.value });
            }}
            className="border border-neutral-300 rounded px-2 py-0.5 text-xs bg-white text-neutral-800"
          />
        </div>

        {/* Date To */}
        <div className="flex items-center gap-1.5">
          <span className="text-neutral-600 font-medium">To:</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              applyFilters({ dateTo: e.target.value });
            }}
            className="border border-neutral-300 rounded px-2 py-0.5 text-xs bg-white text-neutral-800"
          />
        </div>

        {isPending && <span className="text-neutral-400 text-xs animate-pulse">Updating...</span>}
      </div>
    </div>
  );
}
