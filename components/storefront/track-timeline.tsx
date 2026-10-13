'use client';

import React from 'react';
import { Check, Clock, AlertTriangle } from 'lucide-react';
import { formatLagosDateTime } from '@/lib/dates';
import type { TrackTimelineStep } from '@/lib/contracts/track';

interface TrackTimelineProps {
  timeline: TrackTimelineStep[];
}

export function TrackTimeline({ timeline }: TrackTimelineProps) {
  if (timeline.length === 0) return null;

  return (
    <div className="py-4" aria-label="Order Status Progress">
      {/* Mobile & Desktop: Vertical Stepper with rich aesthetics */}
      <div className="relative pl-7 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-neutral-200">
        {timeline.map((step, idx) => {
          const isDone = step.state === 'done';
          const isCurrent = step.state === 'current';
          const isCancelled = step.key === 'cancelled';

          return (
            <div
              key={step.key}
              className="relative group"
              aria-current={isCurrent ? 'step' : undefined}
            >
              {/* Step Icon Indicator */}
              <div
                className={`absolute -left-7 top-0.5 flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-all ${
                  isCancelled
                    ? 'bg-red-600 text-white ring-4 ring-red-100'
                    : isDone
                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-100'
                    : isCurrent
                    ? 'bg-brand-blue text-white ring-4 ring-brand-blue/20 animate-pulse'
                    : 'bg-neutral-100 text-neutral-400 border border-neutral-300'
                }`}
              >
                {isCancelled ? (
                  <AlertTriangle className="h-3.5 w-3.5" />
                ) : isDone ? (
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                ) : isCurrent ? (
                  <span className="w-2 h-2 rounded-full bg-white" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>

              {/* Step Content Card */}
              <div
                className={`rounded-card-sm p-3 border transition-colors ${
                  isCurrent
                    ? 'bg-brand-blueLight/30 border-brand-blue/30 shadow-xs'
                    : isCancelled
                    ? 'bg-red-50/50 border-red-200'
                    : isDone
                    ? 'bg-white border-neutral-200/80'
                    : 'bg-neutral-50/50 border-neutral-200/40 opacity-70'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span
                    className={`text-sm font-semibold ${
                      isCurrent
                        ? 'text-brand-blue font-bold'
                        : isCancelled
                        ? 'text-red-700'
                        : isDone
                        ? 'text-neutral-900'
                        : 'text-neutral-500'
                    }`}
                  >
                    {step.label}
                  </span>

                  {step.at && (
                    <span className="text-[11px] font-mono text-neutral-500 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-neutral-400" />
                      {formatLagosDateTime(step.at)}
                    </span>
                  )}
                </div>

                {isCurrent && (
                  <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                    {step.key === 'new' && 'Your order was successfully recorded. We are checking availability.'}
                    {step.key === 'confirmed' && 'Item is reserved. Waiting for bank transfer verification.'}
                    {step.key === 'paid' && 'Payment verified in bank app. Order handed to preparation desk.'}
                    {step.key === 'processing' && 'Your gadget is undergoing testing and being packaged.'}
                    {step.key === 'shipped' && 'Package has been dispatched or is ready for pickup!'}
                    {step.key === 'delivered' && 'Order has been delivered. Thank you for choosing Keraunous!'}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
