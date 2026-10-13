/**
 * Public Wishlist Page (/wishlist) (U09)
 * Client-rendered list of saved product IDs resolved from server.
 * Blueprint §4, §9.5, §10.3
 */
import type { Metadata } from 'next';
import { WishlistView } from '@/components/storefront/wishlist-view';

export const metadata: Metadata = {
  title: 'Wishlist | Keraunous Tech Store',
  description: 'Your saved phones and gadgets on this device.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function WishlistPage() {
  return (
    <main className="min-h-[70vh] bg-neutral-50/50 py-6">
      <WishlistView />
    </main>
  );
}
