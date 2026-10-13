'use client';

import React from 'react';
import {
  Clock,
  CheckCircle,
  Truck,
  DollarSign,
  AlertTriangle,
  MessageSquare,
  User,
  Eye,
  EyeOff,
} from 'lucide-react';
import { formatLagosDateTime } from '@/lib/dates';
import type { AdminOrderEvent } from '@/lib/contracts/admin-orders';

interface OrderTimelineProps {
  events: AdminOrderEvent[];
}

export function OrderTimeline({ events }: OrderTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="text-xs text-neutral-500 italic py-4 text-center">
        No event history recorded yet.
      </div>
    );
  }

  function getEventIcon(type: string, toStatus: string | null) {
    if (type === 'price_adjusted') {
      return <DollarSign className="h-4 w-4 text-emerald-600" />;
    }
    if (type === 'delivery_fee_set') {
      return <Truck className="h-4 w-4 text-brand-blue" />;
    }
    if (type === 'hold_expired') {
      return <AlertTriangle className="h-4 w-4 text-amber-600" />;
    }
    if (type === 'note') {
      return <MessageSquare className="h-4 w-4 text-purple-600" />;
    }
    if (toStatus === 'delivered') {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    if (toStatus === 'shipped') {
      return <Truck className="h-4 w-4 text-indigo-600" />;
    }
    if (toStatus === 'paid') {
      return <DollarSign className="h-4 w-4 text-emerald-600" />;
    }
    return <Clock className="h-4 w-4 text-neutral-500" />;
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200">
      {events.map((event) => (
        <div key={event.id} className="relative group">
          {/* Timeline node icon */}
          <div className="absolute -left-6 top-0 flex items-center justify-center w-5 h-5 rounded-full bg-white border border-neutral-300 shadow-xs">
            {getEventIcon(event.type, event.toStatus)}
          </div>

          <div className="bg-neutral-50/80 hover:bg-neutral-50 border border-neutral-200 rounded-card-sm p-3 transition-colors">
            {/* Header: Title / Transition + Actor + Time */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-neutral-900">
                {event.fromStatus && event.toStatus ? (
                  <span>
                    Status: <span className="uppercase text-neutral-500">{event.fromStatus}</span> &rarr;{' '}
                    <span className="uppercase text-brand-blue">{event.toStatus}</span>
                  </span>
                ) : (
                  <span className="capitalize">{event.type.replace(/_/g, ' ')}</span>
                )}

                {event.isCustomerVisible ? (
                  <span
                    className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200"
                    title="Visible to customer on tracking page"
                  >
                    <Eye className="h-2.5 w-2.5" /> Public
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-600"
                    title="Internal staff note only"
                  >
                    <EyeOff className="h-2.5 w-2.5" /> Internal
                  </span>
                )}
              </div>

              <div className="text-[11px] text-neutral-400">
                {formatLagosDateTime(event.createdAt)}
              </div>
            </div>

            {/* Note content */}
            {event.note && (
              <p className="mt-1.5 text-xs text-neutral-700 leading-relaxed font-sans whitespace-pre-wrap">
                {event.note}
              </p>
            )}

            {/* Actor indicator */}
            <div className="mt-2 flex items-center gap-1 text-[11px] text-neutral-500">
              <User className="h-3 w-3 text-neutral-400" />
              <span>{event.actorName ? `${event.actorName} (Staff)` : 'Customer / System'}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
