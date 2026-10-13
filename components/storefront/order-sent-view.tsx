/**
 * Order Sent / WhatsApp Handoff View (U10)
 * Rendered on /order/sent after order creation.
 * Displays public order ID, WhatsApp links, fallbacks, and 4-step "What happens next".
 * Blueprint §8.3, §10.3
 */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  MessageSquare,
  QrCode,
  ArrowRight,
} from 'lucide-react';
import type { CreateOrderResponseData } from '@/lib/contracts/orders';
import { formatNgn } from '@/lib/money';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useOrderList } from '@/lib/hooks/use-order-list';

export function OrderSentView() {
  const { toast } = useToast();
  const { clear: clearOrderList } = useOrderList();
  const [order, setOrder] = useState<CreateOrderResponseData | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('krn:last_order');
      if (raw) {
        const parsed = JSON.parse(raw);
        setOrder(parsed);
        // Clear order list once order is recorded
        clearOrderList();
      }
    } catch {
      // Session storage unavailable
    }
  }, [clearOrderList]);

  // Ping /api/orders/handoff when user opens WhatsApp
  const recordHandoff = async () => {
    if (!order) return;
    try {
      await fetch('/api/orders/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicId: order.publicId,
          token: order.handoffToken,
        }),
      });
    } catch {
      // Non-blocking ping
    }
  };

  const handleOpenWhatsApp = () => {
    if (!order) return;
    recordHandoff();
    window.open(order.whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyOrderId = () => {
    if (!order) return;
    navigator.clipboard.writeText(order.publicId);
    setCopiedId(true);
    toast({
      title: 'Order ID Copied',
      description: order.publicId,
      variant: 'info',
    });
    setTimeout(() => setCopiedId(false), 2500);
  };

  const handleCopyMessage = () => {
    if (!order) return;
    navigator.clipboard.writeText(order.messageText);
    setCopiedMsg(true);
    toast({
      title: 'Message Copied',
      description: 'You can paste it directly into WhatsApp chat.',
      variant: 'info',
    });
    setTimeout(() => setCopiedMsg(false), 2500);
  };

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-neutral-900">
          No Recent Order Found
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          If you recently placed an order, please check your WhatsApp chat or track your order with your phone number.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button asChild>
            <Link href="/shop">Browse Store</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/track">Track an Order</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header / Success */}
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-neutral-900 sm:text-3xl">
          Order Saved! Ready for WhatsApp
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          Your order has been recorded. Tap below to send your structured order directly to our official WhatsApp.
        </p>
      </div>

      {/* Order ID Banner */}
      <div className="mt-8 flex flex-col items-center justify-between gap-3 rounded-card-md border border-brand-blue/30 bg-blue-50/60 p-4 sm:flex-row">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-blue">
            Your Order Tracking ID
          </span>
          <div className="font-mono text-xl font-bold tracking-tight text-neutral-900">
            {order.publicId}
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleCopyOrderId}
          className="gap-1.5 text-xs font-semibold"
        >
          <Copy className="h-3.5 w-3.5" />
          {copiedId ? 'Copied!' : 'Copy Order ID'}
        </Button>
      </div>

      {/* Primary Action: Open WhatsApp */}
      <div className="mt-8 space-y-4">
        <Button
          type="button"
          size="lg"
          variant="whatsapp"
          onClick={handleOpenWhatsApp}
          className="w-full gap-2 py-6 text-lg font-bold shadow-lg transition-transform hover:scale-[1.01]"
        >
          <MessageSquare className="h-6 w-6" />
          Open WhatsApp to Send Order
        </Button>

        {/* Fallbacks */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleCopyMessage}
            className="gap-1.5 text-xs text-neutral-700"
          >
            <Copy className="h-3.5 w-3.5" />
            {copiedMsg ? 'Message Copied!' : 'Copy Order Message'}
          </Button>

          <Button
            asChild
            variant="secondary"
            size="sm"
            className="gap-1.5 text-xs text-neutral-700"
          >
            <a
              href={order.waWebUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={recordHandoff}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open WhatsApp Web (Desktop)
            </a>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowQr((v) => !v)}
            className="gap-1.5 text-xs text-neutral-600"
          >
            <QrCode className="h-3.5 w-3.5" />
            {showQr ? 'Hide QR Code' : 'Scan QR Code'}
          </Button>
        </div>

        {/* QR Code display */}
        {showQr && (
          <div className="mt-4 flex flex-col items-center justify-center rounded-card-md border border-neutral-200 bg-neutral-0 p-6 text-center">
            <p className="text-xs font-medium text-neutral-600 mb-3">
              Scan this with your phone to open WhatsApp immediately:
            </p>
            {/* Direct Google Charts QR code image for wa.me URL */}
            <div className="rounded-lg border border-neutral-200 p-2 bg-neutral-0">
              <Image
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  order.whatsappUrl,
                )}`}
                alt="WhatsApp Order QR Code"
                width={180}
                height={180}
                unoptimized
                className="mx-auto"
              />
            </div>
          </div>
        )}
      </div>

      {/* Order Summary Snapshot */}
      <div className="mt-10 rounded-card-md border border-neutral-200 bg-neutral-0 p-6 shadow-sm">
        <h2 className="text-base font-bold text-neutral-900">
          Order Summary ({order.items.length} {order.items.length === 1 ? 'item' : 'items'})
        </h2>
        <ul className="mt-4 divide-y divide-neutral-100 text-sm">
          {order.items.map((item, idx) => (
            <li key={idx} className="flex justify-between py-2.5">
              <div>
                <span className="font-semibold text-neutral-900">
                  {item.qty}x {item.name}
                </span>
                <span className="block text-xs text-neutral-500">
                  {item.label}
                </span>
              </div>
              <span className="font-medium text-neutral-800">
                {formatNgn(item.unitPriceNgn * item.qty)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t border-neutral-200 pt-3 flex justify-between font-bold text-base text-neutral-900">
          <span>Estimated Total</span>
          <span className="text-brand-blue">{formatNgn(order.totalNgn)}</span>
        </div>
      </div>

      {/* What Happens Next (Blueprint §10.3 requirement) */}
      <div className="mt-10 rounded-card-md border border-neutral-200 bg-neutral-0 p-6 shadow-sm">
        <h2 className="text-base font-bold text-neutral-900">
          What happens next?
        </h2>
        <ol className="mt-4 space-y-4 text-sm text-neutral-700">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-blue text-xs font-bold text-white">
              1
            </span>
            <div>
              <strong className="font-semibold text-neutral-900">Send WhatsApp Message:</strong>{' '}
              Tap the button above to send your pre-filled order directly to our official line.
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-blue text-xs font-bold text-white">
              2
            </span>
            <div>
              <strong className="font-semibold text-neutral-900">Stock & Price Confirmation:</strong>{' '}
              Our staff confirms item availability and shares the official bank transfer details (OPay).
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-blue text-xs font-bold text-white">
              3
            </span>
            <div>
              <strong className="font-semibold text-neutral-900">Inspection & Payment:</strong>{' '}
              Make your bank transfer and share the payment receipt on WhatsApp for instant verification.
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-blue text-xs font-bold text-white">
              4
            </span>
            <div>
              <strong className="font-semibold text-neutral-900">Dispatch & Delivery:</strong>{' '}
              Your gadget is packed, tested, and dispatched with live waybill tracking!
            </div>
          </li>
        </ol>
      </div>

      {/* Tracking Link */}
      <div className="mt-8 text-center">
        <p className="text-xs text-neutral-500">
          Want to check this order later?
        </p>
        <Button asChild variant="ghost" size="sm" className="mt-1 gap-1 text-xs text-brand-blue">
          <Link href={`/track?id=${order.publicId}`}>
            Go to Order Tracking Page
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
