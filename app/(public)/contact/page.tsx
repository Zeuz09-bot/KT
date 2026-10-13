import type { Metadata } from 'next';
import { PolicyLayout } from '@/components/storefront/policy-layout';
import { OFFICIAL_CONTACT } from '@/lib/policies';
import { Phone, MessageCircle, MapPin, Clock, ExternalLink, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us & Store Location | Keraunous Tech Store',
  description:
    'Reach Keraunous Tech Store via WhatsApp (+234 807 082 2409), direct phone, or email. Store pickup available in Ondo State, Nigeria.',
};

export default function ContactPage() {
  const whatsappUrl = `https://wa.me/${OFFICIAL_CONTACT.whatsappE164.replace(/\+/g, '')}?text=${encodeURIComponent(
    'Hello Keraunous! I would like to inquire about an available gadget.',
  )}`;

  return (
    <PolicyLayout
      title="Contact Us & Store Location"
      badge="Customer Support"
      subtitle="Reach our sales and customer assistance desk directly. We are always responsive to assist with gadget specifications, stock inquiries, and order handoffs."
    >
      {/* Contact Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* WhatsApp Card */}
        <div className="bg-neutral-50 rounded-card-lg border border-neutral-200 p-6 space-y-3">
          <div className="flex items-center gap-2 text-brand-whatsappDark font-bold text-base">
            <MessageCircle className="h-5 w-5 text-emerald-600" />
            WhatsApp Orders & Chat (Fastest)
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Send inquiries, request live device videos, verify variant stock, or track existing orders in real time.
          </p>
          <div className="pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-card-md bg-brand-whatsapp text-neutral-900 font-bold hover:bg-brand-whatsappDark text-sm transition-all shadow-sm"
            >
              <MessageCircle className="h-4 w-4" />
              Chat: {OFFICIAL_CONTACT.displayPhone}
            </a>
          </div>
        </div>

        {/* Direct Phone Line */}
        <div className="bg-neutral-50 rounded-card-lg border border-neutral-200 p-6 space-y-3">
          <div className="flex items-center gap-2 text-neutral-900 font-bold text-base">
            <Phone className="h-5 w-5 text-brand-blue" />
            Direct Phone Calls
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Need urgent phone confirmation regarding an in-transit dispatch or store pickup? Call our line directly.
          </p>
          <div className="pt-2">
            <a
              href={`tel:${OFFICIAL_CONTACT.whatsappE164}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-card-md bg-white border border-neutral-300 text-neutral-900 font-bold hover:bg-neutral-100 text-sm transition-all"
            >
              <Phone className="h-4 w-4 text-brand-blue" />
              Call {OFFICIAL_CONTACT.displayPhone}
            </a>
          </div>
        </div>

        {/* Physical Store Location */}
        <div className="bg-neutral-50 rounded-card-lg border border-neutral-200 p-6 space-y-3">
          <div className="flex items-center gap-2 text-neutral-900 font-bold text-base">
            <MapPin className="h-5 w-5 text-purple-600" />
            Store Location & Pickup
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Physical hub located in <strong>{OFFICIAL_CONTACT.state}, Nigeria</strong>. Customers wishing to inspect
            and pick up orders in person can coordinate exact street coordinates via WhatsApp.
          </p>
          <div className="pt-2">
            <a
              href="https://maps.google.com/?q=Ondo+State+Nigeria"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-brand-blue font-semibold hover:underline"
            >
              <span>View Ondo State on Google Maps</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Operating Hours */}
        <div className="bg-neutral-50 rounded-card-lg border border-neutral-200 p-6 space-y-3">
          <div className="flex items-center gap-2 text-neutral-900 font-bold text-base">
            <Clock className="h-5 w-5 text-amber-600" />
            Operating & Handoff Hours
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Our WhatsApp chat is active <strong>24/7</strong> for order reception and pre-sale questions. Same-day
            in-store pickups and local dispatches run Monday through Saturday during regular business daylight hours.
          </p>
          <div className="pt-2 text-xs font-semibold text-neutral-700">
            Support Email: <a href={`mailto:${OFFICIAL_CONTACT.email}`} className="text-brand-blue hover:underline">{OFFICIAL_CONTACT.email}</a>
          </div>
        </div>
      </div>

      {/* Security Tip */}
      <div className="p-4 rounded-card-md bg-blue-50/60 border border-blue-200 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-brand-blue shrink-0 mt-0.5" />
        <div className="text-xs text-neutral-700 leading-relaxed">
          <strong>Security note:</strong> For your security, all official bank transfers must be directed strictly to our
          verified OPay business account (8070822409). Read our full anti-impersonation notice on{' '}
          <a href="/verify-accounts" className="text-brand-blue font-semibold underline">
            Verify Our Accounts
          </a>.
        </div>
      </div>
    </PolicyLayout>
  );
}
