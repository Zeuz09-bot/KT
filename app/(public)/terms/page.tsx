import type { Metadata } from 'next';
import { PolicyLayout } from '@/components/storefront/policy-layout';
import { FileText, ShieldAlert, Scale, DollarSign, RefreshCw } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service | Keraunous Tech Store',
  description:
    'Our terms of service governing catalogue browsing, WhatsApp order coordination, server price authority, bank payments, and warranty commitments.',
};

export default function TermsPage() {
  return (
    <PolicyLayout
      title="Terms of Service"
      badge="Legal & Commercial Terms"
      subtitle="Please review the terms and conditions that govern browsing our showcase catalogue, submitting orders, and completing transactions with Keraunous Tech Store."
    >
      {/* 1. General Acceptance */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
          <Scale className="h-5 w-5 text-brand-blue" />
          1. Agreement to Terms
        </h2>
        <p className="text-sm text-neutral-700 leading-relaxed">
          By accessing the Keraunous Tech Store website (keraunous.ng), submitting an order request, or interacting
          with our sales representatives on WhatsApp, you agree to be bound by these Terms of Service, our Privacy
          Policy, and our Warranty Guidelines. If you do not agree, please discontinue use of this site.
        </p>
      </section>

      {/* 2. Order Submission & Confirmation */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
          <FileText className="h-5 w-5 text-brand-blue" />
          2. Nature of Orders & Stock Validation
        </h2>
        <p className="text-sm text-neutral-700 leading-relaxed">
          Keraunous operates a <strong>structured showcase catalogue</strong>. Placing an order on the website records
          your intended purchase and generates a prefilled message for WhatsApp. An order becomes commercially binding
          only when:
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-neutral-800">
          <li>Our sales representative confirms active inventory availability on WhatsApp.</li>
          <li>Payment is confirmed directly inside our official banking application.</li>
        </ul>
        <p className="text-sm text-neutral-700 leading-relaxed">
          We reserve the right to cancel or decline an order request if an item has gone out of stock, has an erroneous
          listing, or if the order details cannot be verified.
        </p>
      </section>

      {/* 3. Pricing & Server Authority */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-emerald-600" />
          3. Server-Authoritative Pricing in Naira (₦)
        </h2>
        <p className="text-sm text-neutral-700 leading-relaxed">
          All prices are quoted in integer Nigerian Naira (₦). Prices displayed in the browser are for information
          only; the final order total is decided authoritatively on our server at checkout creation. If exchange rate
          fluctuations or promotional adjustments cause a price update while an item is in your list, our server will
          reject mismatched amounts and display the latest updated total.
        </p>
      </section>

      {/* 4. Payment Verification Protocol */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-amber-600" />
          4. Anti-Fraud Payment Protocol
        </h2>
        <p className="text-sm text-neutral-700 leading-relaxed">
          Payments must be transferred exclusively into our verified business account: <strong>OPay (8070822409,
          KERAUNOUS TECH)</strong>. In accordance with strict operational security protocols:
        </p>
        <div className="p-4 rounded-card-md bg-amber-50/70 border border-amber-200 text-xs sm:text-sm text-neutral-800 space-y-1.5">
          <p>
            <strong>No gadget will be released or handed to a courier based on payment screenshots, transaction receipts,
            or SMS alerts alone.</strong>
          </p>
          <p>
            Physical release or dispatch takes place only after the corresponding credit reflects inside our banking
            application.
          </p>
        </div>
      </section>

      {/* 5. Inspection & Returns */}
      <section className="space-y-3 pt-2">
        <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-brand-blue" />
          5. Returns, Replacements & Warranty
        </h2>
        <p className="text-sm text-neutral-700 leading-relaxed">
          Warranty coverage is conditioned on device tier (12 months for Brand New, 90 days for Open Box, 30 days for
          UK Used) and provides a 7-day swap window for factory hardware defects. Warranty does not cover liquid damage,
          drops, crushed screens, or third-party unauthorized repairs. Complete terms are set forth on our{' '}
          <a href="/warranty" className="text-brand-blue font-semibold underline">Warranty & Returns Policy</a>.
        </p>
      </section>

      {/* 6. Limitation of Liability */}
      <section className="space-y-3 pt-2">
        <h2 className="text-xl font-bold text-neutral-900">6. Limitation of Liability</h2>
        <p className="text-sm text-neutral-700 leading-relaxed">
          To the maximum extent permitted by Nigerian law, Keraunous Tech Store will not be liable for indirect,
          incidental, or consequential damages arising from delays caused by interstate road transport or courier delays
          beyond our direct control. Our aggregate liability for any proven claim shall not exceed the amount actually
          paid for the specific gadget in dispute.
        </p>
      </section>

      {/* 7. Governing Law */}
      <section className="space-y-3 pt-2">
        <h2 className="text-xl font-bold text-neutral-900">7. Governing Law & Jurisdiction</h2>
        <p className="text-sm text-neutral-700 leading-relaxed">
          These Terms of Service are governed by and construed in accordance with the laws of the Federal Republic
          of Nigeria. Any disputes arising in connection with these terms shall be resolved within the jurisdiction
          of Ondo State, Nigeria.
        </p>
      </section>
    </PolicyLayout>
  );
}
