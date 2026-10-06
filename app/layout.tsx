import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Keraunous Tech Store | Premium Phones & Gadgets',
  description:
    'Browse premium smartphones, tablets, and gadgets in Nigeria. Authentic devices, warranty guaranteed, order directly on WhatsApp.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
