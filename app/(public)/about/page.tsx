import type { Metadata } from 'next';
import Link from 'next/link';
import { PolicyLayout } from '@/components/storefront/policy-layout';
import { CheckCircle2, MapPin, MessageCircle, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us | Keraunous Tech Store',
  description:
    'Discover Keraunous Tech Store: Nigeria’s dedicated phone and gadget showcase based in Ondo State. Built on authentic devices and direct WhatsApp checkout.',
};

export default function AboutPage() {
  return (
    <PolicyLayout
      title="About Keraunous Tech Store"
      badge="Our Story & Mission"
      subtitle="Connecting Nigerian gadget enthusiasts with authentic, thoroughly tested smartphones, tablets, and laptops through direct, trustworthy communication."
    >
      {/* Intro Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-neutral-900">Who We Are</h2>
        <p className="text-sm sm:text-base text-neutral-700 leading-relaxed">
          Keraunous Tech Store (often known simply as Keraunos Tech) is an independent electronics and smartphone
          retailer based in <strong>Ondo State, Nigeria</strong>. We specialise in genuine smartphones, MacBooks,
          iPads, and essential premium accessories.
        </p>
        <p className="text-sm sm:text-base text-neutral-700 leading-relaxed">
          The Nigerian gadget market can be fraught with counterfeit items, undisclosed repairs, and opaque pricing.
          We founded Keraunous to offer a refreshing alternative: <strong>100% authentic inventory</strong>, transparent
          product grading (Brand New, Open Box, and UK Used), and straightforward customer interactions.
        </p>
      </section>

      {/* Why WhatsApp Ordering */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-brand-blue" />
          Why We Prioritise Direct WhatsApp Checkout
        </h2>
        <p className="text-sm text-neutral-700 leading-relaxed">
          Instead of automated, impersonal shopping carts that fail to answer your questions about battery health or
          exact physical conditions, we designed our platform around <strong>structured WhatsApp handoffs</strong>:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-card-md bg-neutral-50 border border-neutral-200 space-y-1.5">
            <h3 className="font-bold text-sm text-neutral-900">Real Device Inspection</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Ask for live videos of the exact device, battery health settings, and IMEI verification before transferring a kobo.
            </p>
          </div>

          <div className="p-4 rounded-card-md bg-neutral-50 border border-neutral-200 space-y-1.5">
            <h3 className="font-bold text-sm text-neutral-900">Zero Payment Gateway Surcharges</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Save on extra third-party card processing fees. You pay directly into our verified corporate bank account.
            </p>
          </div>

          <div className="p-4 rounded-card-md bg-neutral-50 border border-neutral-200 space-y-1.5">
            <h3 className="font-bold text-sm text-neutral-900">Personal Delivery Coordination</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Arrange tailored waybill logistics or choose free in-person pickup directly with the representative handling your package.
            </p>
          </div>

          <div className="p-4 rounded-card-md bg-neutral-50 border border-neutral-200 space-y-1.5">
            <h3 className="font-bold text-sm text-neutral-900">Permanent Record & Tracking</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Every order generates a unique Order ID (e.g. KRN-YYMMDD-XXXXX) that you can look up live on our tracking portal.
            </p>
          </div>
        </div>
      </section>

      {/* Core Principles */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-blue" />
          Our Non-Negotiable Standards
        </h2>
        <div className="space-y-3">
          {[
            'Zero Fake Claims: We never display fictitious review counts, fake testimonials, or fabricated star ratings.',
            'Server-Enforced Fair Pricing: All prices are fixed in Nigerian Naira (₦) with no hidden conversion fees or surprise surcharges.',
            '24-Point Hardware Testing: Every UK Used phone is tested for Face ID, True Tone, cameras, cellular radios, and battery integrity.',
            'Clear Condition Labels: Brand New means sealed factory box; Open Box means pristine condition; UK Used means tested Grade A.',
          ].map((principle, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3.5 rounded-card-md bg-neutral-50 border border-neutral-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="text-sm text-neutral-800">{principle}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Physical Hub & Contact */}
      <section className="space-y-3 pt-2">
        <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-brand-blue" />
          Visit Us in Ondo State
        </h2>
        <p className="text-sm text-neutral-700 leading-relaxed">
          We are proudly anchored in Ondo State, serving both walk-in customers and dispatching nationwide across
          Nigeria. Read more on our{' '}
          <Link href="/contact" className="text-brand-blue font-semibold hover:underline">
            Contact & Location Page
          </Link>{' '}
          or browse our{' '}
          <Link href="/shop" className="text-brand-blue font-semibold hover:underline">
            full gadget catalogue
          </Link>.
        </p>
      </section>
    </PolicyLayout>
  );
}
