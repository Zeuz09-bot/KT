/**
 * PublicLayout — standard public layout with announcement bar, navbar, footer, and floating WhatsApp contact.
 */
import * as React from 'react';
import { AnnouncementBar } from '@/components/storefront/announcement-bar';
import { Navbar, NavbarProps } from '@/components/storefront/navbar';
import { Footer } from '@/components/storefront/footer';
import { FloatingWhatsAppButton } from '@/components/storefront/floating-whatsapp-button';

export interface PublicLayoutProps extends NavbarProps {
  children: React.ReactNode;
  showAnnouncement?: boolean;
  announcementText?: string;
  showFloatingWhatsApp?: boolean;
}

export function PublicLayout({
  children,
  orderListCount,
  wishlistCount,
  showAnnouncement = true,
  announcementText,
  showFloatingWhatsApp = true,
}: PublicLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 text-neutral-900 font-sans antialiased">
      {/* Skip to main content link for screen readers */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-card-sm focus:bg-brand-blue focus:px-4 focus:py-2 focus:text-neutral-0 focus:shadow-md"
      >
        Skip to main content
      </a>

      {showAnnouncement && <AnnouncementBar message={announcementText} />}
      <Navbar orderListCount={orderListCount} wishlistCount={wishlistCount} />

      <main id="main-content" className="flex-1 flex flex-col focus:outline-none" tabIndex={-1}>
        {children}
      </main>

      <Footer />
      {showFloatingWhatsApp && <FloatingWhatsAppButton />}
    </div>
  );
}
