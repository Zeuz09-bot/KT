/**
 * Public Order List Page (/order-list) (U09)
 * Client-rendered list holding { variantId, qty } with live server resolution.
 * Blueprint §4, §9.5, §10.3
 */
import type { Metadata } from 'next';
import { OrderListView } from '@/components/storefront/order-list-view';

export const metadata: Metadata = {
  title: 'Order List | Keraunous Tech Store',
  description: 'Review your selected gadgets and prepare your structured WhatsApp order.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function OrderListPage() {
  return (
    <main className="min-h-[70vh] bg-neutral-50/50 py-6">
      <OrderListView />
    </main>
  );
}
