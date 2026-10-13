'use client';

import React, { useState } from 'react';
import { MessageSquare, Copy, ExternalLink, Check } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { formatNgn } from '@/lib/money';
import type { AdminOrderDetail } from '@/lib/contracts/admin-orders';

interface OrderMessageTemplatesProps {
  order: AdminOrderDetail;
}

export function OrderMessageTemplates({ order }: OrderMessageTemplatesProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const cleanPhone = order.customerPhone.replace(/\+/g, '');
  const itemsSummary = order.items.map((i) => `${i.qty}x ${i.productName} (${i.variantLabel})`).join(', ');

  const templates = [
    {
      id: 'confirmed',
      title: '1. Order Confirmed & Payment Request',
      text: `Hello ${order.customerName},\n\nYour order *${order.publicId}* at Keraunous Tech Store is confirmed!\nItems: ${itemsSummary}\nTotal: ${formatNgn(order.totalNgn)}\n\nPlease make payment to our official account:\nBank: *OPay*\nAccount Number: *8070822409*\nAccount Name: *Keraunous Tech*\n\nReply with your transfer receipt screenshot once completed. We will prepare your gadget immediately!`,
    },
    {
      id: 'paid',
      title: '2. Payment Verified & Processing',
      text: `Hello ${order.customerName},\n\nPayment confirmed for order *${order.publicId}*! We are now inspecting, preparing, and packaging your device. We will update you with shipping details shortly.`,
    },
    {
      id: 'shipped',
      title: '3. Dispatched / Courier Waybill',
      text: `Hello ${order.customerName},\n\nYour order *${order.publicId}* has been dispatched!\nCourier: *${order.courierName || 'Designated Dispatch'}*\nTracking Number: *${order.trackingNumber || 'Available on request'}*\n\nYou can track the live status here:\nhttps://keraunous.ng/track?id=${order.publicId}`,
    },
    {
      id: 'delivered',
      title: '4. Delivered & Thank You',
      text: `Hello ${order.customerName},\n\nYour order *${order.publicId}* has been delivered! Thank you for choosing Keraunous Tech Store. Let us know if you need anything else or have questions about your new device!`,
    },
  ];

  function handleCopy(key: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast({
      title: 'Template Copied',
      description: 'Message copied to clipboard.',
    });
    setTimeout(() => setCopiedKey(null), 2500);
  }

  return (
    <div className="bg-neutral-0 rounded-card-md border border-neutral-200 p-4 space-y-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900 border-b border-neutral-100 pb-2">
        <MessageSquare className="h-4 w-4 text-emerald-600" />
        WhatsApp Customer Response Templates
      </div>

      <div className="space-y-3">
        {templates.map((tmpl) => {
          const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(tmpl.text)}`;
          const isCopied = copiedKey === tmpl.id;

          return (
            <div
              key={tmpl.id}
              className="bg-neutral-50/75 border border-neutral-200/80 rounded-card-sm p-3 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between font-medium text-neutral-800">
                <span>{tmpl.title}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleCopy(tmpl.id, tmpl.text)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 transition-colors"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span className="text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors font-semibold"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Open WhatsApp
                  </a>
                </div>
              </div>

              <p className="text-neutral-600 bg-white p-2 rounded border border-neutral-200/60 font-mono text-[11px] whitespace-pre-wrap leading-relaxed max-h-24 overflow-y-auto">
                {tmpl.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
