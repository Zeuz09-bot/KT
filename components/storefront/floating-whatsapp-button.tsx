/**
 * FloatingWhatsAppButton — accessible fixed floating chat button for quick inquiries.
 */
'use client';

import * as React from 'react';
import { MessageCircle } from 'lucide-react';
import { DEFAULT_BUSINESS_SETTINGS } from '@/lib/constants';

export interface FloatingWhatsAppButtonProps {
  whatsappNumber?: string;
  message?: string;
}

export function FloatingWhatsAppButton({
  whatsappNumber = DEFAULT_BUSINESS_SETTINGS.whatsappNumber,
  message = 'Hello Keraunous Tech Store, I would like to inquire about available gadgets.',
}: FloatingWhatsAppButtonProps) {
  const cleanPhone = whatsappNumber.replace(/[^0-9]/g, '');
  const encodedMsg = encodeURIComponent(message);
  const href = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;

  return (
    <aside
      aria-label="Quick WhatsApp Contact"
      className="fixed bottom-6 right-6 z-40 print:hidden"
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-2.5 rounded-full bg-brand-whatsapp text-neutral-900 px-4 py-3 shadow-lg hover:shadow-xl hover:brightness-105 active:scale-95 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-whatsapp min-h-[48px]"
        aria-label="Chat with us on WhatsApp"
      >
        <MessageCircle className="h-6 w-6 shrink-0 text-neutral-900 fill-current" aria-hidden="true" />
        <span className="text-sm font-bold tracking-tight pr-1 hidden sm:inline-block">
          Chat on WhatsApp
        </span>
      </a>
    </aside>
  );
}
