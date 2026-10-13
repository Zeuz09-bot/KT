import type { Metadata } from 'next';
import { PolicyLayout } from '@/components/storefront/policy-layout';
import { OFFICIAL_PAYMENT_ACCOUNT, OFFICIAL_CONTACT } from '@/lib/policies';
import { CheckCircle2, ShieldAlert, Phone, Building2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Verify Our Official Accounts & Anti-Scam Notice | Keraunous Tech Store',
  description:
    'Confirm our official business WhatsApp number and OPay bank transfer details. Guard yourself against impostors and fraudulent payment requests.',
};

export default function VerifyAccountsPage() {
  return (
    <PolicyLayout
      title="Verify Our Official Accounts"
      badge="Anti-Scam & Buyer Safety"
      subtitle="Before transferring funds or completing an order, confirm that you are interacting with our genuine channels. We release devices solely upon verified bank credits."
    >
      {/* High-Alert Warning Banner */}
      <div className="rounded-card-lg bg-red-50 border-2 border-red-200 p-5 sm:p-6 space-y-3">
        <div className="flex items-center gap-2 text-red-800 font-bold text-base">
          <ShieldAlert className="h-5 w-5 text-red-600 shrink-0" />
          Critical Anti-Fraud Warning
        </div>
        <p className="text-sm text-red-900 leading-relaxed">
          Keraunous Tech Store operates <strong>ONLY ONE</strong> official WhatsApp number and{' '}
          <strong>ONE</strong> verified bank account. We will <strong>NEVER</strong> direct you to pay
          into a staff personal bank account, third-party agent account, crypto wallet, airtime PIN, or
          external payment link.
        </p>
      </div>

      {/* Official Bank Account Card */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-brand-blue" />
          1. Official Bank Transfer Account
        </h2>
        <p className="text-sm text-neutral-600">
          When your order is confirmed on WhatsApp, send payments only to this registered business account:
        </p>

        <div className="bg-neutral-50 rounded-card-lg border border-neutral-200 p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="border-b sm:border-b-0 sm:border-r border-neutral-200 pb-3 sm:pb-0 sm:pr-4">
              <span className="text-xs uppercase tracking-wider text-neutral-500 font-semibold block">
                Bank Institution
              </span>
              <span className="text-lg font-extrabold text-neutral-900 mt-1 block">
                {OFFICIAL_PAYMENT_ACCOUNT.bank}
              </span>
            </div>

            <div className="border-b sm:border-b-0 sm:border-r border-neutral-200 pb-3 sm:pb-0 sm:pr-4">
              <span className="text-xs uppercase tracking-wider text-neutral-500 font-semibold block">
                Account Number
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-xl font-black text-brand-blue tracking-wider">
                  {OFFICIAL_PAYMENT_ACCOUNT.accountNumber}
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs uppercase tracking-wider text-neutral-500 font-semibold block">
                Account Name
              </span>
              <span className="text-base font-bold text-emerald-800 mt-1 block">
                {OFFICIAL_PAYMENT_ACCOUNT.accountName}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-200 text-xs text-neutral-600 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Always check that your bank app displays &quot;KERAUNOUS TECH&quot; before authorizing your transfer.</span>
          </div>
        </div>
      </section>

      {/* Official Contact Channels */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
          <Phone className="h-5 w-5 text-brand-blue" />
          2. Official Communication Channels
        </h2>
        <div className="bg-neutral-50 rounded-card-lg border border-neutral-200 p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-neutral-200">
            <span className="text-sm font-semibold text-neutral-700">Official WhatsApp (Chat & Orders):</span>
            <span className="font-mono text-base font-bold text-neutral-900">{OFFICIAL_CONTACT.whatsappE164}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-neutral-200">
            <span className="text-sm font-semibold text-neutral-700">Phone Calls / Customer Line:</span>
            <span className="font-mono text-base font-bold text-neutral-900">{OFFICIAL_CONTACT.displayPhone}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2">
            <span className="text-sm font-semibold text-neutral-700">Official Physical Hub:</span>
            <span className="text-sm font-medium text-neutral-900">{OFFICIAL_CONTACT.state}, Nigeria</span>
          </div>
        </div>
      </section>

      {/* Verification Checklist */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-neutral-900">3. Safe Ordering Verification Checklist</h2>
        <div className="space-y-3">
          {[
            'You initiated contact or were redirected through our official website: https://keraunous.ng',
            'The WhatsApp phone number matches +234 807 082 2409 exactly.',
            'Your recipient account is named KERAUNOUS TECH in OPay.',
            'You received a structured KRN Order ID (e.g. KRN-YYMMDD-XXXXX) that you can track on /track.',
            'No salesperson has pressured you into sending funds to any alternate account name.',
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3.5 rounded-card-md bg-neutral-50 border border-neutral-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="text-sm text-neutral-800">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Payment Release Policy */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-neutral-900">4. Internal Payment Verification Protocol</h2>
        <p className="text-sm text-neutral-700 leading-relaxed">
          Per our operational security rules, we release or dispatch devices strictly after the credit alert
          is confirmed inside our official banking application. <strong>We do not release gadgets based solely on
          screenshots of transaction receipts or SMS alerts.</strong> This safeguards both our business and our
          customers against fake credit scams.
        </p>
      </section>
    </PolicyLayout>
  );
}
