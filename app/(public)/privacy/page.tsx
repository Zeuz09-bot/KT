import type { Metadata } from 'next';
import { PolicyLayout } from '@/components/storefront/policy-layout';
import { OFFICIAL_CONTACT } from '@/lib/policies';
import { Database, Lock, EyeOff, FileText, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | Keraunous Tech Store',
  description:
    'Our privacy and data protection policy in accordance with the Nigeria Data Protection Act 2023 (NDPA). Learn how your order and contact information is handled.',
};

export default function PrivacyPage() {
  return (
    <PolicyLayout
      title="Privacy Policy"
      badge="Data Protection & NDPA Notice"
      subtitle="Keraunous Tech Store is dedicated to protecting your personal information. We gather strictly what is required to fulfil your order and coordinate delivery via WhatsApp."
    >
      {/* Legal disclaimer banner */}
      <div className="p-4 rounded-card-md bg-neutral-100 border border-neutral-300 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-neutral-600 shrink-0 mt-0.5" />
        <div className="text-xs text-neutral-700 leading-relaxed">
          <strong>Legal notice:</strong> This privacy statement reflects our current operating practices
          under the <strong>Nigeria Data Protection Act 2023 (NDPA)</strong>. It is formulated for customer transparency
          and is subject to regular legal counsel review.
        </div>
      </div>

      {/* 1. Information We Collect */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
          <Database className="h-5 w-5 text-brand-blue" />
          1. Information We Collect
        </h2>
        <p className="text-sm text-neutral-700 leading-relaxed">
          Because we do not require account registration, passwords, or online credit card inputs, our data collection
          is minimal. We collect only:
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-neutral-800">
          <li><strong>Contact Details:</strong> Your full customer name and Nigerian WhatsApp phone number (stored in standard E.164 format).</li>
          <li><strong>Fulfilment Coordinates:</strong> Delivery city, state, and street address (or in-store pickup selection).</li>
          <li><strong>Order Content:</strong> The specific gadget items, variant IDs, quantities, and order notes submitted.</li>
          <li><strong>Technical Diagnostics:</strong> Anonymized or hashed IP address and user-agent string used solely for rate limiting and bot mitigation.</li>
        </ul>
      </section>

      {/* 2. How We Use Your Data */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
          <FileText className="h-5 w-5 text-brand-blue" />
          2. Purpose of Processing
        </h2>
        <p className="text-sm text-neutral-700 leading-relaxed">
          Your details are processed strictly for the following lawful business purposes:
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-neutral-800">
          <li>Prefilling your WhatsApp order message so you can complete purchase discussions directly.</li>
          <li>Generating your secure public Order ID (KRN-YYMMDD-XXXXX) and enabling live status tracking on /track.</li>
          <li>Waybill labeling and handover to registered Nigerian logistics partners for delivery.</li>
          <li>Internal accounting, fraud prevention, and warranty claim validation.</li>
        </ul>
      </section>

      {/* 3. Third-Party Sharing & Marketing */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
          <EyeOff className="h-5 w-5 text-emerald-600" />
          3. We Never Sell Your Data
        </h2>
        <p className="text-sm text-neutral-700 leading-relaxed">
          We maintain a strict anti-spam policy. <strong>We do not sell, rent, or trade your phone number or order history
          to third-party advertisers or telemarketers.</strong> Your delivery address is shared only with the courier
          driver or logistics agency responsible for physically transporting your package.
        </p>
      </section>

      {/* 4. Security & Data Retention */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
          <Lock className="h-5 w-5 text-brand-blue" />
          4. Data Storage & Security
        </h2>
        <p className="text-sm text-neutral-700 leading-relaxed">
          All order records are stored in encrypted databases protected by database-level Row Level Security (RLS)
          and role-based admin authorization. Public order tracking requires both your Order ID and the exact matching
          phone number, ensuring that random order probing is strictly blocked.
        </p>
        <p className="text-sm text-neutral-700 leading-relaxed">
          Order records are retained for historical warranty validation and legal accounting records.
        </p>
      </section>

      {/* 5. Customer Rights & Contact */}
      <section className="space-y-3 pt-2">
        <h2 className="text-xl font-bold text-neutral-900">5. Your Rights Under the NDPA</h2>
        <p className="text-sm text-neutral-700 leading-relaxed">
          As a Nigerian data subject under the NDPA, you have the right to request access to the order information we
          hold regarding your transactions, or request correction of erroneous details. For any privacy inquiries,
          reach out to our designated compliance contact:
        </p>
        <div className="p-4 rounded-card-md bg-neutral-50 border border-neutral-200 text-xs text-neutral-700 space-y-1">
          <div><strong>Data Controller:</strong> Keraunous Tech Store</div>
          <div><strong>Email:</strong> {OFFICIAL_CONTACT.email}</div>
          <div><strong>WhatsApp / Phone:</strong> {OFFICIAL_CONTACT.displayPhone}</div>
          <div><strong>Location:</strong> {OFFICIAL_CONTACT.state}, Nigeria</div>
        </div>
      </section>
    </PolicyLayout>
  );
}
