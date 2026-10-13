import type { Metadata } from 'next';
import { TrackOrderView } from '@/components/storefront/track-order-view';

export const metadata: Metadata = {
  title: 'Track Order | Keraunous Tech Store',
  description: 'Track your Keraunous gadget order status live with your Order ID and phone number.',
  robots: {
    index: false,
    follow: false,
  },
};

interface TrackPageProps {
  searchParams: Promise<{
    id?: string;
  }>;
}

export default async function TrackPage({ searchParams }: TrackPageProps) {
  const { id } = await searchParams;
  const initialPublicId = typeof id === 'string' ? id.trim().toUpperCase() : '';
  const businessWhatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+2348070822409';

  return (
    <main className="min-h-[75vh] bg-neutral-50/50 py-10">
      <TrackOrderView
        initialPublicId={initialPublicId}
        businessWhatsappNumber={businessWhatsappNumber}
      />
    </main>
  );
}
