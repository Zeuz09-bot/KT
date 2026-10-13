import type { Metadata } from 'next';
import { PolicyLayout } from '@/components/storefront/policy-layout';
import { WARRANTY_POLICIES } from '@/lib/policies';
import { ShieldCheck, RefreshCw, XCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Warranty & Return Policy | Keraunous Tech Store',
  description:
    'Clear, condition-specific warranty terms for Brand New (12 months), Open Box (90 days), and UK Used (30 days with 7-day swap window).',
};

export default function WarrantyPage() {
  const tiers = [
    WARRANTY_POLICIES.brandNew,
    WARRANTY_POLICIES.openBox,
    WARRANTY_POLICIES.ukUsed,
  ];

  return (
    <PolicyLayout
      title="Warranty & Return Policy"
      badge="Authenticity & Protection"
      subtitle="We stand firmly behind every phone and gadget we sell. Our warranty guidelines are tiered transparently by device condition so you know exactly what is covered."
    >
      {/* Condition Tiers */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-brand-blue" />
          1. Condition-Specific Warranty Tiers
        </h2>

        <div className="space-y-5">
          {tiers.map((tier) => (
            <div
              key={tier.condition}
              className="p-6 rounded-card-lg bg-neutral-50/70 border border-neutral-200 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 pb-3">
                <div>
                  <h3 className="text-lg font-extrabold text-neutral-900">{tier.name}</h3>
                  <span className="text-xs text-neutral-500 font-medium">
                    Swap / Return Window: {tier.returnSwapWindowDays} Days for verified flaws
                  </span>
                </div>
                <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-bold text-xs">
                  Warranty Period: {tier.durationLabel}
                </div>
              </div>

              <p className="text-sm text-neutral-700 leading-relaxed">
                {tier.summary}
              </p>

              <div className="space-y-1.5 pt-1">
                <span className="text-xs uppercase tracking-wider text-neutral-500 font-semibold block">
                  Coverage Highlights:
                </span>
                <ul className="space-y-1 text-xs text-neutral-800">
                  {tier.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7-Day Replacement Guarantee */}
      <section className="space-y-3 pt-2">
        <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-brand-blue" />
          2. The 7-Day Swap & Replacement Window
        </h2>
        <p className="text-sm text-neutral-700 leading-relaxed">
          If any device you receive displays an unresolvable factory or hardware defect (such as network dropouts,
          Face ID failure, charging port flaw, or screen flicker) within <strong>7 days of delivery</strong>, contact
          our sales desk on WhatsApp immediately.
        </p>
        <p className="text-sm text-neutral-700 leading-relaxed">
          Following swift physical verification by our technicians to confirm that the issue was not caused by
          mishandling or accidents, we will <strong>swap the unit for an identical tested device</strong> or arrange
          prompt technical resolution.
        </p>
      </section>

      {/* Non-Negotiable Warranty Exclusions */}
      <section className="space-y-4 pt-2">
        <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
          <XCircle className="h-5 w-5 text-red-600" />
          3. What Void / Cancel Warranty Coverage
        </h2>
        <p className="text-sm text-neutral-700 leading-relaxed">
          To ensure fairness and prevent fraudulent claims, the following conditions completely void warranty
          and replacement coverage:
        </p>

        <div className="space-y-2.5">
          {WARRANTY_POLICIES.exclusions.map((exclusion, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3.5 rounded-card-md bg-red-50/60 border border-red-200"
            >
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <span className="text-xs sm:text-sm text-neutral-800">{exclusion}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How to initiate a claim */}
      <section className="space-y-3 pt-2">
        <h2 className="text-xl font-bold text-neutral-900">4. How to Submit a Warranty Inquiry</h2>
        <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm text-neutral-700">
          <li>Message our WhatsApp line with your Order ID (e.g. KRN-YYMMDD-XXXXX).</li>
          <li>Send a clear video demonstrating the technical symptom and device IMEI screen (*#06#).</li>
          <li>Our technical support lead will review and guide you on dispatch or in-store drop-off.</li>
        </ol>
      </section>
    </PolicyLayout>
  );
}
