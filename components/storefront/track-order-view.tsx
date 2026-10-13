'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Package,
  Copy,
  Check,
  MessageCircle,
  Truck,
  RotateCcw,
  Store,
  Info,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import { StatusPill } from '@/components/admin/status-pill';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { formatNgn } from '@/lib/money';
import { formatLagosDateTime } from '@/lib/dates';
import { TrackOrderForm } from '@/components/storefront/track-order-form';
import { TrackTimeline } from '@/components/storefront/track-timeline';
import { buildOrderInquiryUrl } from '@/modules/whatsapp';
import type { TrackOrderResponseData } from '@/lib/contracts/track';

interface TrackOrderViewProps {
  initialPublicId?: string;
  businessWhatsappNumber?: string;
}

export function TrackOrderView({
  initialPublicId = '',
  businessWhatsappNumber = '+2348070822409',
}: TrackOrderViewProps) {
  const [result, setResult] = useState<TrackOrderResponseData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleLookup(publicId: string, phone: string, turnstileToken: string) {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId, phone, turnstileToken }),
      });

      const body = await res.json();
      if (!res.ok || !body.ok) {
        setErrorMessage(
          body?.error?.message ||
            'Order not found or details mismatch. Please check your order ID and phone number.',
        );
        return;
      }

      setResult(body.data);
    } catch {
      setErrorMessage(
        'Unable to complete lookup at this time. Please check your internet connection or try again.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleCopyId(id: string) {
    navigator.clipboard.writeText(id);
    setCopied(true);
    toast({
      title: 'Order ID Copied',
      description: `${id} copied to clipboard`,
      variant: 'info',
    });
    setTimeout(() => setCopied(false), 2000);
  }

  const waInquiryUrl = result
    ? buildOrderInquiryUrl(businessWhatsappNumber, result.publicId)
    : '';

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Page Title & Intro */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-blue/10 text-brand-blue text-xs font-semibold">
          <Truck className="h-3.5 w-3.5" /> Live Order Tracking
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
          Track Your Gadget Order
        </h1>
        <p className="text-sm text-neutral-600 max-w-md mx-auto">
          Enter your Order ID and phone number to view live progress from confirmation to delivery.
        </p>
      </div>

      {!result ? (
        /* Form Card */
        <div className="bg-white rounded-card-lg border border-neutral-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          <TrackOrderForm
            initialPublicId={initialPublicId}
            onSubmit={handleLookup}
            isLoading={isLoading}
            errorMessage={errorMessage}
          />

          <div className="pt-4 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Privacy protected
            </span>
            <Link href="/shop" className="text-brand-blue hover:underline">
              Continue Shopping &rarr;
            </Link>
          </div>
        </div>
      ) : (
        /* Result View Card */
        <div className="space-y-6 animate-fade-in">
          {/* Status Header Card */}
          <div className="bg-white rounded-card-lg border border-neutral-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-4">
              <div>
                <span className="text-xs font-medium text-neutral-500 block">Order Identifier</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono font-bold text-lg text-neutral-900 tracking-wider">
                    {result.publicId}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyId(result.publicId)}
                    className="p-1 rounded text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition-colors"
                    title="Copy Order ID"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-medium text-neutral-500 block mb-1">Status</span>
                <StatusPill status={result.status} />
              </div>
            </div>

            {/* Fulfilment & Destination badge */}
            <div className="flex flex-wrap items-center justify-between text-xs text-neutral-600 gap-2">
              <div className="flex items-center gap-1.5">
                {result.fulfilment === 'delivery' ? (
                  <>
                    <Truck className="h-4 w-4 text-brand-blue" />
                    <span>
                      Delivery to {result.deliveryCity ? `${result.deliveryCity}, ` : ''}
                      {result.deliveryState || 'Nigeria'}
                    </span>
                  </>
                ) : (
                  <>
                    <Store className="h-4 w-4 text-purple-600" />
                    <span>In-Store Pickup (Akure, Ondo State)</span>
                  </>
                )}
              </div>

              <div className="text-neutral-400 flex items-center gap-1 font-mono">
                <Calendar className="h-3.5 w-3.5" />
                {formatLagosDateTime(result.createdAt)}
              </div>
            </div>
          </div>

          {/* Stepper Timeline Card */}
          <div className="bg-white rounded-card-lg border border-neutral-200 p-6 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wide flex items-center gap-2">
              <Package className="h-4 w-4 text-brand-blue" />
              Order Progress
            </h2>
            <TrackTimeline timeline={result.timeline} />
          </div>

          {/* Courier Card if present */}
          {result.courier && (
            <div className="bg-indigo-50/50 border border-indigo-200 rounded-card-lg p-5 space-y-2">
              <div className="text-xs font-semibold text-indigo-900 uppercase tracking-wide flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-indigo-600" />
                Courier Waybill Details
              </div>
              <div className="text-sm text-neutral-800 space-y-1">
                {result.courier.name && (
                  <div>
                    <span className="text-xs text-neutral-500">Carrier:</span>{' '}
                    <span className="font-semibold">{result.courier.name}</span>
                  </div>
                )}
                {result.courier.trackingNumber && (
                  <div>
                    <span className="text-xs text-neutral-500">Waybill / Tracking No:</span>{' '}
                    <span className="font-mono font-semibold">{result.courier.trackingNumber}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Latest Update Note Card if present */}
          {result.latestNote && (
            <div className="bg-amber-50/60 border border-amber-200 rounded-card-lg p-4 space-y-1.5">
              <div className="text-xs font-semibold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
                <Info className="h-4 w-4 text-amber-600" />
                Latest Store Update
              </div>
              <p className="text-xs text-neutral-800 leading-relaxed font-sans">
                {result.latestNote}
              </p>
            </div>
          )}

          {/* Items Summary Card */}
          <div className="bg-white rounded-card-lg border border-neutral-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wide">
              Order Items ({result.items.length})
            </h2>

            <div className="divide-y divide-neutral-100 text-sm">
              {result.items.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-neutral-900">{item.name}</div>
                    <div className="text-xs text-neutral-500 mt-0.5">{item.label}</div>
                    <div className="text-xs text-neutral-600 mt-0.5 font-mono">
                      Qty: {item.qty} &times; {formatNgn(item.unitPriceNgn)}
                    </div>
                  </div>
                  <div className="font-mono font-bold text-neutral-900">
                    {formatNgn(item.lineTotalNgn)}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-neutral-200 flex justify-between items-center text-sm font-bold text-neutral-900">
              <span>Total Amount</span>
              <span className="font-mono text-base text-brand-blue">
                {formatNgn(result.totalNgn)}
              </span>
            </div>
          </div>

          {/* Primary Action Button: WhatsApp inquiry */}
          <div className="space-y-3 pt-2">
            <a
              href={waInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-card-md bg-brand-whatsapp text-neutral-900 font-bold hover:bg-brand-whatsappDark active:scale-[0.99] transition-all shadow-sm text-sm"
            >
              <MessageCircle className="h-5 w-5" />
              Message us on WhatsApp about this order
            </a>

            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setResult(null)}
              className="w-full gap-2 text-xs text-neutral-600"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Track another order
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
