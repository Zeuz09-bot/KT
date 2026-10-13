/**
 * Order Sent Page (/order/sent) (U10)
 * WhatsApp handoff page.
 * Blueprint §4, §8.3, §10.3
 */
import type { Metadata } from 'next';
import { OrderSentView } from '@/components/storefront/order-sent-view';

export const metadata: Metadata = {
  title: 'Order Sent — Complete on WhatsApp | Keraunous Tech Store',
  description: 'Your order has been recorded. Send your order directly to Keraunous on WhatsApp.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function OrderSentPage() {
  return (
    <main className="min-h-[75vh] bg-neutral-50/50 py-8">
      <OrderSentView />
    </main>
  );
}
