'use client';

import React from 'react';
import Link from 'next/link';
import {
  MessageCircle,
  Clock,
  AlertCircle,
  Truck,
  Store,
  Copy,
  ChevronRight,
} from 'lucide-react';
import { StatusPill } from '@/components/admin/status-pill';
import { formatNgn } from '@/lib/money';
import { maskPhone } from '@/lib/phone';
import { formatLagosDateTime } from '@/lib/dates';
import { toast } from '@/components/ui/toast';
import { Pagination } from '@/components/ui/pagination';
import type { AdminOrderListItem } from '@/lib/contracts/admin-orders';

interface OrderListTableProps {
  orders: AdminOrderListItem[];
  total: number;
  currentPage: number;
  pageSize: number;
}

export function OrderListTable({
  orders,
  total,
  currentPage,
  pageSize,
}: OrderListTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function handleCopyId(id: string) {
    navigator.clipboard.writeText(id);
    toast({
      title: 'Copied',
      description: `Order ID ${id} copied to clipboard`,
    });
  }

  if (orders.length === 0) {
    return (
      <div className="bg-neutral-0 rounded-card-lg border border-neutral-200 p-12 text-center shadow-sm">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 mb-3">
          <Truck className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-neutral-900">No orders found</h3>
        <p className="text-sm text-neutral-500 mt-1 max-w-sm mx-auto">
          No orders match the selected filters or search criteria. Try resetting your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-neutral-0 rounded-card-lg border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/75 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                <th scope="col" className="py-3 px-4">Order ID &amp; Time</th>
                <th scope="col" className="py-3 px-4">Customer</th>
                <th scope="col" className="py-3 px-4">Fulfilment</th>
                <th scope="col" className="py-3 px-4">Total</th>
                <th scope="col" className="py-3 px-4">Status &amp; Alerts</th>
                <th scope="col" className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200/80">
              {orders.map((order) => {
                const cleanPhone = order.customerPhone.replace(/\+/g, '');
                const waChatUrl = `https://wa.me/${cleanPhone}`;

                return (
                  <tr
                    key={order.id}
                    className="hover:bg-neutral-50/50 transition-colors group"
                  >
                    {/* Order ID & Time */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-mono font-semibold text-neutral-900 hover:text-brand-blue hover:underline"
                        >
                          {order.publicId}
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleCopyId(order.publicId)}
                          className="text-neutral-400 hover:text-neutral-700 p-0.5 rounded"
                          title="Copy Public ID"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="text-xs text-neutral-500 mt-0.5">
                        {formatLagosDateTime(order.createdAt)}
                      </div>
                      <div className="text-xs text-neutral-400 mt-0.5">
                        {order.itemCount} item{order.itemCount === 1 ? '' : 's'}
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-medium text-neutral-900">{order.customerName}</div>
                      <div className="font-mono text-xs text-neutral-500 mt-0.5">
                        {maskPhone(order.customerPhone)}
                      </div>
                    </td>

                    {/* Fulfilment */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-800">
                        {order.fulfilment === 'delivery' ? (
                          <>
                            <Truck className="h-3.5 w-3.5 text-brand-blue shrink-0" />
                            <span>Delivery</span>
                          </>
                        ) : (
                          <>
                            <Store className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                            <span>Pickup</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Total */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-semibold text-neutral-900">
                        {formatNgn(order.totalNgn)}
                      </div>
                    </td>

                    {/* Status & Alert Badges */}
                    <td className="py-3.5 px-4 align-top space-y-1.5">
                      <div>
                        <StatusPill status={order.status} size="sm" />
                      </div>

                      {/* Operational Alerts */}
                      <div className="flex flex-wrap gap-1">
                        {order.alerts.notContacted && (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200"
                            title="Customer has not yet opened WhatsApp from the handoff page"
                          >
                            <AlertCircle className="h-2.5 w-2.5" />
                            Not yet contacted
                          </span>
                        )}

                        {order.alerts.holdExpiring && (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-700 border border-red-200 animate-pulse"
                            title="Payment hold is expiring soon without confirmed bank payment"
                          >
                            <Clock className="h-2.5 w-2.5" />
                            Hold expiring
                          </span>
                        )}

                        {order.alerts.awaitingPayment && (
                          <span
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200"
                          >
                            Awaiting payment
                          </span>
                        )}

                        {order.alerts.toShip && (
                          <span
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200"
                          >
                            To ship
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 align-top text-right space-x-2">
                      <a
                        href={waChatUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                        title="Chat with customer on WhatsApp"
                      >
                        <MessageCircle className="h-3 w-3" />
                        WhatsApp
                      </a>

                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-neutral-100 text-neutral-800 hover:bg-neutral-200 transition-colors"
                      >
                        View
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 pt-2 text-xs text-neutral-500">
          <div>
            Showing {(currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, total)} of {total} orders
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              const url = new URL(window.location.href);
              url.searchParams.set('page', String(page));
              window.location.href = url.pathname + url.search;
            }}
          />
        </div>
      )}
    </div>
  );
}
