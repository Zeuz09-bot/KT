import type { Metadata } from 'next';
import { PolicyLayout } from '@/components/storefront/policy-layout';
import { DELIVERY_ZONES } from '@/lib/policies';
import { Truck, MapPin, Clock, PackageCheck, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Delivery & In-Store Pickup Policy | Keraunous Tech Store',
  description:
    'Delivery timelines across Nigeria: Ondo State, Lagos, Abuja, Ibadan, and interstate express shipping. Registered waybill tracking and free in-store pickup.',
};

export default function DeliveryPage() {
  return (
    <PolicyLayout
      title="Delivery & Pickup Policy"
      badge="Shipping & Fulfilment"
      subtitle="We handle prompt dispatch for local and interstate orders across Nigeria using verified couriers and insured express waybills."
    >
      {/* Overview section */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
          <Truck className="h-5 w-5 text-brand-blue" />
          Coverage Zones & Delivery Timelines
        </h2>
        <p className="text-sm text-neutral-700 leading-relaxed">
          Orders confirmed and paid for before 2:00 PM are packaged and dispatched on the same business day.
          Below are the standard delivery windows for our primary corridors:
        </p>

        <div className="space-y-4 pt-2">
          {DELIVERY_ZONES.map((zone) => (
            <div
              key={zone.id}
              className="p-5 rounded-card-md bg-neutral-50/70 border border-neutral-200 space-y-2.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <h3 className="font-bold text-base text-neutral-900">{zone.name}</h3>
                <span className="inline-flex items-center gap-1 font-mono text-xs font-bold px-2.5 py-1 rounded bg-blue-100/70 text-brand-blue">
                  <Clock className="h-3 w-3" />
                  {zone.turnaround}
                </span>
              </div>
              <p className="text-xs text-neutral-600 font-semibold">
                Covered States: {zone.states.join(', ')}
              </p>
              <p className="text-xs text-neutral-700 leading-relaxed">
                {zone.description}
              </p>
              <div className="text-[11px] text-neutral-500 font-medium">
                Logistics Partner: {zone.courierType}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* In-store pickup section */}
      <section className="space-y-4 pt-2">
        <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-purple-600" />
          Free In-Store Pickup in Ondo State
        </h2>
        <p className="text-sm text-neutral-700 leading-relaxed">
          If you reside in or are passing through Ondo State, you can choose <strong>In-Store Pickup</strong> during
          checkout at zero shipping cost.
        </p>
        <div className="p-4 rounded-card-md bg-purple-50/60 border border-purple-200 text-xs text-purple-950 space-y-2">
          <div className="font-bold">Pickup Instructions:</div>
          <ul className="list-disc list-inside space-y-1 text-purple-900">
            <li>Select &quot;In-Store Pickup (Ondo State)&quot; when placing your order.</li>
            <li>Our sales rep will share our physical store pickup address once stock is confirmed.</li>
            <li>Bring your Order ID (KRN-YYMMDD-XXXXX) and matching phone for swift in-person handoff.</li>
            <li>Inspect your device, test physical functions, and finalize transfer on the spot.</li>
          </ul>
        </div>
      </section>

      {/* Waybill tracking & Packaging */}
      <section className="space-y-4 pt-2">
        <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
          <PackageCheck className="h-5 w-5 text-emerald-600" />
          Waybill Tracking & Secure Packaging
        </h2>
        <p className="text-sm text-neutral-700 leading-relaxed">
          Every interstate shipment is enclosed in tamper-evident protective bubble packaging. As soon as the courier
          driver logs your parcel, your tracking details are entered into our system. You can check your waybill number
          and carrier anytime on <a href="/track" className="text-brand-blue font-semibold underline">/track</a>.
        </p>
      </section>

      {/* Delivery Inspection Note */}
      <div className="p-4 rounded-card-md bg-amber-50/60 border border-amber-200 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-neutral-800 leading-relaxed">
          <strong>Important inspection note:</strong> Upon receiving your package from the courier or driver,
          please examine the outer security seal before unboxing. Test the screen, cameras, and connectivity
          promptly.
        </div>
      </div>
    </PolicyLayout>
  );
}
