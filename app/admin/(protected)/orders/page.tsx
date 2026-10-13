import React from 'react';
import type { Metadata } from 'next';
import { requireAdmin } from '@/modules/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { listOrders } from '@/modules/orders/admin-repo';
import { OrderFilters } from '@/components/admin/order-filters';
import { OrderListTable } from '@/components/admin/order-list-table';
import type { OrderStatus, FulfilmentType } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Orders Desk | Keraunous Admin',
};

interface AdminOrdersPageProps {
  searchParams: Promise<{
    status?: string;
    fulfilment?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
  }>;
}

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const { profile } = await requireAdmin();
  const supabase = await createClient();

  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;
  const pageSize = 20;

  const statusFilter =
    params.status && params.status !== 'all'
      ? [params.status as OrderStatus]
      : undefined;

  const fulfilmentFilter =
    params.fulfilment && params.fulfilment !== 'all'
      ? (params.fulfilment as FulfilmentType)
      : undefined;

  const { orders, total } = await listOrders(supabase, {
    status: statusFilter,
    fulfilment: fulfilmentFilter,
    search: params.search,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    page: isNaN(page) ? 1 : page,
    pageSize,
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Orders Desk</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Manage incoming WhatsApp orders, confirm stock, verify bank payments, and track fulfillment.
          </p>
        </div>
      </div>

      <OrderFilters
        currentStatus={params.status || 'all'}
        currentFulfilment={params.fulfilment || 'all'}
        currentSearch={params.search || ''}
        currentDateFrom={params.dateFrom || ''}
        currentDateTo={params.dateTo || ''}
        isOwner={profile.role === 'owner'}
      />

      <OrderListTable
        orders={orders}
        total={total}
        currentPage={isNaN(page) ? 1 : page}
        pageSize={pageSize}
      />
    </div>
  );
}
