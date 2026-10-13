import React from 'react';
import Link from 'next/link';
import { ShieldCheck, MessageCircle, ArrowLeft, Clock } from 'lucide-react';
import { OFFICIAL_CONTACT } from '@/lib/policies';

interface PolicyLayoutProps {
  title: string;
  badge?: string;
  subtitle: string;
  lastUpdated?: string;
  children: React.ReactNode;
}

export function PolicyLayout({
  title,
  badge = 'Store Policy',
  subtitle,
  lastUpdated = 'October 2026',
  children,
}: PolicyLayoutProps) {
  const whatsappUrl = `https://wa.me/${OFFICIAL_CONTACT.whatsappE164.replace(/\+/g, '')}?text=${encodeURIComponent(
    `Hello Keraunous, I have a question about your ${title.toLowerCase()}.`,
  )}`;

  return (
    <div className="bg-neutral-50/60 min-h-screen py-10 sm:py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Navigation Breadcrumb / Back Link */}
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <Link
            href="/"
            className="inline-flex items-center gap-1 hover:text-brand-blue transition-colors font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Home
          </Link>
          <div className="flex items-center gap-1 text-neutral-400">
            <Clock className="h-3.5 w-3.5" />
            <span>Last reviewed: {lastUpdated}</span>
          </div>
        </div>

        {/* Header Header */}
        <div className="bg-white rounded-card-lg border border-neutral-200/90 p-6 sm:p-10 shadow-sm space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-blue/10 text-brand-blue text-xs font-semibold">
            <ShieldCheck className="h-3.5 w-3.5" />
            {badge}
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
            {title}
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 leading-relaxed max-w-2xl">
            {subtitle}
          </p>
        </div>

        {/* Main Content Body */}
        <div className="bg-white rounded-card-lg border border-neutral-200/90 p-6 sm:p-10 shadow-sm">
          <div className="prose prose-neutral max-w-none text-neutral-800 text-sm sm:text-base leading-relaxed space-y-8">
            {children}
          </div>
        </div>

        {/* WhatsApp Assistance Footer Banner */}
        <div className="bg-brand-navy rounded-card-lg p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1.5 text-center sm:text-left">
            <h3 className="font-bold text-lg text-white">Need Clarification or Assistance?</h3>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-md">
              Our verified sales desk is active 24/7 on WhatsApp. Ask about gadget conditions, deliveries, or payments directly.
            </p>
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-card-md bg-brand-whatsapp text-neutral-900 font-bold hover:bg-brand-whatsappDark transition-all text-sm shrink-0 shadow-sm"
          >
            <MessageCircle className="h-4 w-4" />
            Chat with Sales on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
