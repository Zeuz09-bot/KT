import type { Metadata } from 'next';
import Link from 'next/link';
import { PolicyLayout } from '@/components/storefront/policy-layout';
import { HOW_TO_ORDER_STEPS } from '@/lib/policies';
import { Smartphone, Send, MessageCircle, Truck, ArrowRight, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'How to Order in 4 Easy Steps | Keraunous Tech Store',
  description:
    'Learn how to browse gadgets, send structured orders to WhatsApp, pay safely via verified bank transfer, and track deliveries across Nigeria.',
};

const stepIcons = [Smartphone, Send, MessageCircle, Truck];

export default function HowToOrderPage() {
  return (
    <PolicyLayout
      title="How to Order on Keraunous"
      badge="Simple 4-Step Process"
      subtitle="Experience seamless gadget shopping tailored for Nigeria. No complex account creation, no online card fraud risks, and complete peace of mind."
    >
      <div className="space-y-8">
        {HOW_TO_ORDER_STEPS.map((step, idx) => {
          const Icon = stepIcons[idx] || Smartphone;
          return (
            <div
              key={step.step}
              className="flex flex-col sm:flex-row items-start gap-5 p-5 sm:p-6 rounded-card-lg bg-neutral-50/60 border border-neutral-200/90 relative overflow-hidden"
            >
              {/* Step number badge */}
              <div className="shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-brand-blue text-white font-extrabold text-lg shadow-sm">
                0{step.step}
              </div>

              {/* Step content */}
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-brand-blue" />
                  <h2 className="text-base sm:text-lg font-bold text-neutral-900">
                    {step.title}
                  </h2>
                </div>
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  {step.subtitle}
                </p>
                <p className="text-sm text-neutral-700 leading-relaxed">
                  {step.description}
                </p>
                <div className="pt-2 text-xs font-semibold text-brand-blue flex items-center gap-1.5">
                  <ArrowRight className="h-3.5 w-3.5" />
                  <span>{step.actionHint}</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Call to action card */}
        <div className="p-6 rounded-card-lg bg-emerald-50/60 border border-emerald-200 space-y-3">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-base">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            Ready to explore our gadget inventory?
          </div>
          <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed">
            Every phone, laptop, and accessory has real Naira pricing and verified stock status.
          </p>
          <div className="pt-2">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-card-md bg-brand-blue text-white font-bold hover:bg-brand-blueDark transition-all text-sm shadow-sm"
            >
              Browse All Gadgets
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </PolicyLayout>
  );
}
