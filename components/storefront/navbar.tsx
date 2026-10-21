/**
 * Navbar — primary site navigation.
 *
 * Blueprint §2 corrections:
 * - No cart → Order List icon (clipboard-list) with count badge
 * - No user avatar / accounts
 * - WhatsApp number always visible at top
 * - Search icon links to /shop
 */
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Heart, ClipboardList, Menu, X, Phone } from 'lucide-react';
import { SearchBar } from './search';
import { KeraunosLogo } from '@/components/ui/keraunos-logo';
import { useOrderList } from '@/lib/hooks/use-order-list';
import { useWishlist } from '@/lib/hooks/use-wishlist';

export interface NavbarProps {
  orderListCount?: number;
  wishlistCount?: number;
}

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'UK Used', href: '/uk-used' },
  { label: 'Best Sellers', href: '/best-sellers' },
  { label: 'Deals', href: '/deals' },
  { label: 'Contact', href: '/contact' },
];

export function Navbar({ orderListCount = 0, wishlistCount = 0 }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { count: liveOrderCount, isHydrated: orderHydrated } = useOrderList();
  const { count: liveWishCount, isHydrated: wishHydrated } = useWishlist();

  const effectiveOrderCount = orderHydrated ? liveOrderCount : orderListCount;
  const effectiveWishCount = wishHydrated ? liveWishCount : wishlistCount;

  return (
    <header className="sticky top-0 z-30 border-b border-brand-silver/40 bg-brand-white/95 backdrop-blur-md shadow-card">
      {/* Top strip: WhatsApp number */}
      <div className="hidden bg-brand-navy py-1.5 text-center text-xs font-medium text-brand-white sm:block border-b border-brand-silver/20">
        <a
          href="tel:+2348070822409"
          className="inline-flex items-center gap-2 hover:text-brand-champagne transition-colors tracking-wide"
        >
          <Phone size={12} className="text-brand-champagne" aria-hidden="true" />
          <span>Direct Concierge: <strong className="text-brand-white font-semibold">0807 082 2409</strong> · WhatsApp Available 24/7</span>
        </a>
      </div>

      {/* Main bar */}
      <nav aria-label="Main navigation">
        <div className="mx-auto flex h-16 max-w-screen-xl items-center gap-3 px-4 sm:px-6">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center group py-1" aria-label="Keraunos Tech Store — Home">
            <KeraunosLogo size="sm" variant="primary" />
          </Link>

          {/* Desktop nav links */}
          <ul className="hidden items-center gap-1 lg:flex font-display" role="list">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-card-sm px-3.5 py-2 text-sm font-medium text-brand-charcoal/80 transition-colors hover:bg-brand-cream hover:text-brand-navy focus-visible:outline-2 focus-visible:outline-brand-navy"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Search — desktop */}
          <div className="hidden flex-1 max-w-md lg:block">
            <SearchBar />
          </div>

          {/* Actions */}
          <div className="ml-auto flex items-center gap-1.5">

            {/* Wishlist */}
            <Link
              href="/wishlist"
              aria-label={`Wishlist${effectiveWishCount > 0 ? ` (${effectiveWishCount} items)` : ''}`}
              className="relative flex h-10 w-10 items-center justify-center rounded-card-sm text-brand-charcoal/80 hover:bg-brand-cream hover:text-brand-navy focus-visible:outline-2 focus-visible:outline-brand-navy transition-colors"
            >
              <Heart size={20} aria-hidden="true" />
              {effectiveWishCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-danger text-[10px] font-bold text-white">
                  {effectiveWishCount > 9 ? '9+' : effectiveWishCount}
                </span>
              )}
            </Link>

            {/* Order List */}
            <Link
              href="/order-list"
              aria-label={`Order List${effectiveOrderCount > 0 ? ` (${effectiveOrderCount} items)` : ''}`}
              className="relative flex h-10 w-10 items-center justify-center rounded-card-sm text-brand-charcoal/80 hover:bg-brand-cream hover:text-brand-navy focus-visible:outline-2 focus-visible:outline-brand-navy transition-colors"
            >
              <ClipboardList size={20} aria-hidden="true" />
              {effectiveOrderCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-navy text-[10px] font-bold text-white border border-brand-silver/50">
                  {effectiveOrderCount > 9 ? '9+' : effectiveOrderCount}
                </span>
              )}
            </Link>

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              className="flex h-10 w-10 items-center justify-center rounded-card-sm text-neutral-600 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-brand-blue lg:hidden"
            >
              {mobileOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div id="mobile-nav" className="border-t border-brand-silver/30 bg-brand-white lg:hidden">
            {/* Search — mobile */}
            <div className="px-4 py-3 bg-brand-cream/40">
              <SearchBar />
            </div>
            <ul className="flex flex-col py-1 font-display" role="list">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-6 py-3 text-sm font-medium text-brand-charcoal/80 hover:bg-brand-cream hover:text-brand-navy transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className="border-t border-brand-silver/20 mt-1 pt-2 px-6 py-3">
                <a
                  href="tel:+2348070822409"
                  className="flex items-center gap-2 text-sm font-medium text-brand-charcoal hover:text-brand-navy"
                >
                  <Phone size={14} className="text-brand-champagne" aria-hidden="true" />
                  0807 082 2409 · WhatsApp 24/7
                </a>
              </li>
            </ul>
          </div>
        )}
      </nav>
    </header>
  );
}
